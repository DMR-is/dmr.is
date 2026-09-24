import { createHash, randomUUID } from 'crypto'
import { literal, Op } from 'sequelize'

import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  IOneSystemsService,
  isDefinitiveOneSystemsFailure,
  isOneSystemsError,
  OneSystemsCreateCaseResult,
} from '@dmr.is/clients-onesystems'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import {
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from './models/mailbox-delivery.enums'
import { MailboxDeliveryModel } from './models/mailbox-delivery.model'
import {
  MAILBOX_DELIVERY_KIND_CONFIGS,
  MailboxDeliveryKindConfig,
  type MailboxDeliveryKindConfigs,
  resolveKindConfig,
} from './mailbox-delivery.kinds'
import {
  DeliverToMailboxInput,
  DeliverToMailboxResult,
  IMailboxDeliveryService,
} from './mailbox-delivery.service.interface'

const LOGGING_CONTEXT = 'MailboxDeliveryService'

/**
 * How long a claim on a row lasts. It must outlast the work done under it: a
 * PDF render plus the 30s timeout of each call to One. Renewed each time a
 * marker is written, so it only has to cover one render and one call.
 */
const LEASE_MINUTES = 5

const MAX_ERROR_LENGTH = 2_000

/** Evaluated by Postgres, so every worker compares leases on one clock. */
const NOW = literal('CURRENT_TIMESTAMP')
const LEASE_EXPIRY = literal(
  `CURRENT_TIMESTAMP + INTERVAL '${LEASE_MINUTES} minutes'`,
)

type IdColumn = 'oneDocumentItemId' | 'islandIsDocumentId'

type DeliveryCompany = Pick<CompanyModel, 'id' | 'name' | 'nationalId'>

/**
 * Delivers notices to island.is mailboxes through One, resumably.
 *
 * ⚠️ Every query passes `transaction: null`. That takes it out of the ambient
 * CLS transaction and makes it an autocommitted statement of its own. A
 * caller's rollback must not erase the record of a case, document or send One
 * has already made, or the next attempt would make it again. Do not wrap any of
 * this in `sequelize.transaction()`: under CLS that is a second connection with
 * a real COMMIT, not a nested savepoint.
 *
 * Resume is driven by the saved ids, not by `status`:
 * - CreateCase finds-or-creates, so repeating it is harmless and it has no
 *   marker. Any failure of it leaves the row FAILED (retryable).
 * - CreateDocument and SendDocToIslandIs are not safe to repeat. Each is
 *   preceded by an `in_flight_step` marker. A clear rejection leaves the row
 *   FAILED; an unclear outcome leaves it UNCERTAIN, which nothing retries. A
 *   marker still set when the row is next claimed means the process died
 *   mid-call, and the row becomes UNCERTAIN then.
 * - Each id is written with `WHERE <column> IS NULL`, and without requiring the
 *   lease, so an id One returned is saved even after the lease lapsed and is
 *   never overwritten by a second one.
 */
@Injectable()
export class MailboxDeliveryService implements IMailboxDeliveryService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(MailboxDeliveryModel)
    private readonly deliveryModel: typeof MailboxDeliveryModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(IOneSystemsService)
    private readonly oneSystems: IOneSystemsService,
    @Inject(MAILBOX_DELIVERY_KIND_CONFIGS)
    private readonly kindConfigs: MailboxDeliveryKindConfigs,
  ) {}

  async deliverToMailbox(
    input: DeliverToMailboxInput,
  ): Promise<DeliverToMailboxResult> {
    if (process.env.ONESYSTEMS_ENABLED !== 'true') {
      return { status: 'DISABLED' }
    }

    // Before any row or call, so a missing classification never leaves a
    // half-started delivery behind.
    const config = resolveKindConfig(input.kind, this.kindConfigs)

    if (!input.idempotencyKey.trim()) {
      throw new InternalServerErrorException(
        'A mailbox delivery needs a non-empty idempotency key',
      )
    }

    const company = await this.companyModel.findOne({
      where: { id: input.companyId },
      attributes: ['id', 'name', 'nationalId'],
      transaction: null,
    })
    if (!company) {
      throw new NotFoundException(`Company ${input.companyId} not found`)
    }

    const row = await this.findOrInsert(input, company)

    const settled = this.settledResult(row)
    if (settled) {
      return settled
    }

    const leaseToken = randomUUID()
    const claimed = await this.claim(row.id, leaseToken)
    if (!claimed) {
      // Someone else holds it, or it settled between the read and the claim.
      const current = await this.deliveryModel.findOne({
        where: { id: row.id },
        transaction: null,
      })
      return (
        (current && this.settledResult(current)) ?? {
          status: 'IN_PROGRESS',
          deliveryId: row.id,
        }
      )
    }

    if (claimed.inFlightStep) {
      await this.markInterrupted(claimed, leaseToken)
      return { status: 'UNCERTAIN', deliveryId: claimed.id }
    }

    return this.run(claimed, leaseToken, input, company, config)
  }

  /**
   * Inserts the row unless the key already has one, then reads whichever row
   * holds the key. Not `findOrCreate`: it always runs inside a transaction
   * (the ambient CLS one, or one it opens), never as the autocommitted
   * statements this needs.
   */
  private async findOrInsert(
    input: DeliverToMailboxInput,
    company: DeliveryCompany,
  ): Promise<MailboxDeliveryModel> {
    await this.deliveryModel.bulkCreate(
      [
        {
          companyId: company.id,
          nationalId: company.nationalId,
          kind: input.kind,
          idempotencyKey: input.idempotencyKey,
          subject: input.subject,
        },
      ],
      { ignoreDuplicates: true, transaction: null },
    )

    const row = await this.deliveryModel.findOne({
      where: { idempotencyKey: input.idempotencyKey },
      transaction: null,
    })
    if (!row) {
      throw new InternalServerErrorException(
        'Mailbox delivery row missing right after insert',
      )
    }

    if (row.companyId !== input.companyId || row.kind !== input.kind) {
      throw new ConflictException(
        `Idempotency key already used by delivery ${row.id} for a different company or kind`,
      )
    }

    return row
  }

  /** The result for a row that needs no work, or null if it needs some. */
  private settledResult(
    row: MailboxDeliveryModel,
  ): DeliverToMailboxResult | null {
    if (
      row.status === MailboxDeliveryStatusEnum.SENT &&
      row.islandIsDocumentId
    ) {
      return {
        status: 'SENT',
        deliveryId: row.id,
        islandIsDocumentId: row.islandIsDocumentId,
        sentAt: row.sentAt,
        alreadySent: true,
      }
    }
    if (row.status === MailboxDeliveryStatusEnum.UNCERTAIN) {
      return { status: 'UNCERTAIN', deliveryId: row.id }
    }
    return null
  }

  /**
   * Claims the row with one conditional UPDATE ... RETURNING: it succeeds only
   * when the row is unsettled and no live lease is on it. No `FOR UPDATE`, which
   * would hold a connection open across the calls to One.
   */
  private async claim(
    id: string,
    leaseToken: string,
  ): Promise<MailboxDeliveryModel | null> {
    const [count, rows] = await this.deliveryModel.update(
      {
        leaseToken,
        leaseExpiresAt: LEASE_EXPIRY,
        attempts: literal('attempts + 1'),
        lastAttemptAt: NOW,
      },
      {
        where: {
          id,
          status: {
            [Op.notIn]: [
              MailboxDeliveryStatusEnum.SENT,
              MailboxDeliveryStatusEnum.UNCERTAIN,
            ],
          },
          [Op.or]: [
            { leaseExpiresAt: null },
            { leaseExpiresAt: { [Op.lt]: NOW } },
          ],
        },
        returning: true,
        transaction: null,
      },
    )
    return count > 0 && rows[0] ? rows[0] : null
  }

  /** A marker left by a process that died mid-call: the outcome is unknown. */
  private async markInterrupted(
    row: MailboxDeliveryModel,
    leaseToken: string,
  ): Promise<void> {
    const step = row.inFlightStep
    this.logger.error(
      `Mailbox delivery ${row.id} was interrupted during ${step}; marking it UNCERTAIN`,
      { context: LOGGING_CONTEXT, deliveryId: row.id, step },
    )
    await this.deliveryModel.update(
      {
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        inFlightStep: null,
        lastError: `Interrupted during ${step}: whether One acted is unknown`,
        lastErrorNumber: null,
        leaseToken: null,
        leaseExpiresAt: null,
      },
      { where: { id: row.id, leaseToken }, transaction: null },
    )
  }

  private async run(
    row: MailboxDeliveryModel,
    leaseToken: string,
    input: DeliverToMailboxInput,
    company: DeliveryCompany,
    config: MailboxDeliveryKindConfig,
  ): Promise<DeliverToMailboxResult> {
    // Set only while a non-idempotent call's outcome is not yet recorded.
    let inFlight: MailboxDeliveryStepEnum | null = null

    try {
      let caseItemId = row.oneCaseItemId
      if (!caseItemId) {
        const created = await this.oneSystems.createCase({
          nationalId: row.nationalId,
          customerName: company.name,
          caseType: config.caseType,
          portal: config.portal,
        })
        caseItemId = await this.saveCase(row.id, created)
      }

      let documentItemId = row.oneDocumentItemId
      if (!documentItemId) {
        const pdf = await input.pdf()
        if (pdf.length === 0) {
          throw new InternalServerErrorException('The rendered PDF is empty')
        }

        await this.setMarker(
          row.id,
          leaseToken,
          MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          {
            pdfSha256: createHash('sha256').update(pdf).digest('hex'),
            pdfSizeBytes: pdf.length,
          },
        )
        // After the marker write: until it lands, One has not been called.
        inFlight = MailboxDeliveryStepEnum.CREATE_DOCUMENT

        const document = await this.oneSystems.createDocument({
          caseItemId,
          subject: row.subject,
          file: pdf,
          extension: 'PDF',
          createDate: input.createDate,
          author: config.author,
          docCategory: config.docCategory,
          docType: config.docType,
          portal: config.portal,
        })
        documentItemId = await this.saveId(
          row.id,
          'oneDocumentItemId',
          document.documentItemId,
          { status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED },
        )
        inFlight = null
      }

      let islandIsDocumentId = row.islandIsDocumentId
      let sentAt = row.sentAt
      if (!islandIsDocumentId) {
        await this.setMarker(
          row.id,
          leaseToken,
          MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
        )
        inFlight = MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS

        const sent = await this.oneSystems.sendDocToIslandIs({
          documentItemId,
          nationalId: row.nationalId,
          category: config.islandIsCategory,
          type: config.islandIsType,
          sendNotification: config.sendNotification,
        })
        sentAt = new Date()
        islandIsDocumentId = await this.saveId(
          row.id,
          'islandIsDocumentId',
          sent.islandIsDocumentId,
          { status: MailboxDeliveryStatusEnum.SENT, sentAt },
        )
        inFlight = null
      }

      await this.release(row.id, leaseToken)

      this.logger.info(`Mailbox delivery ${row.id} sent`, {
        context: LOGGING_CONTEXT,
        deliveryId: row.id,
        companyId: row.companyId,
        kind: row.kind,
      })

      return {
        status: 'SENT',
        deliveryId: row.id,
        islandIsDocumentId,
        sentAt,
        alreadySent: false,
      }
    } catch (error) {
      // Only a non-idempotent call whose outcome is unclear is UNCERTAIN.
      // Anything before its marker (a render, CreateCase) left One untouched.
      const outcome =
        inFlight && !isDefinitiveOneSystemsFailure(error)
          ? MailboxDeliveryStatusEnum.UNCERTAIN
          : MailboxDeliveryStatusEnum.FAILED
      await this.recordFailure(row.id, leaseToken, outcome, inFlight, error)
      throw error
    }
  }

  /**
   * Saves the case. If another worker saved one first, its case is kept and
   * used: CreateCase finds-or-creates, so both name the same case.
   */
  private async saveCase(
    id: string,
    created: OneSystemsCreateCaseResult,
  ): Promise<string> {
    const [count] = await this.deliveryModel.update(
      {
        oneCaseItemId: created.caseItemId,
        oneCaseNumber: created.caseNumber,
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
      },
      { where: { id, oneCaseItemId: null }, transaction: null },
    )
    if (count > 0) {
      return created.caseItemId
    }

    const current = await this.deliveryModel.findOne({
      where: { id },
      attributes: ['id', 'oneCaseItemId'],
      transaction: null,
    })
    if (!current?.oneCaseItemId) {
      throw new InternalServerErrorException(
        `Could not save the One case for mailbox delivery ${id}`,
      )
    }
    return current.oneCaseItemId
  }

  /**
   * Writes the id One returned, only into an empty column. An id already there
   * means another worker's call got there first; ours is then a duplicate in
   * One, which is logged with its id for reconciliation and thrown.
   */
  private async saveId(
    id: string,
    column: IdColumn,
    value: string,
    changes: { status: MailboxDeliveryStatusEnum; sentAt?: Date },
  ): Promise<string> {
    const [count] = await this.deliveryModel.update(
      { [column]: value, ...changes, inFlightStep: null },
      { where: { id, [column]: null }, transaction: null },
    )
    if (count > 0) {
      return value
    }

    this.logger.error(
      `Mailbox delivery ${id} already had ${column} when One returned ${value}; ${value} is a duplicate in One`,
      { context: LOGGING_CONTEXT, deliveryId: id, column, duplicateId: value },
    )
    throw new InternalServerErrorException(
      `Mailbox delivery ${id} already had ${column}; One returned a duplicate`,
    )
  }

  /**
   * Writes the marker for the call about to be made, and renews the lease so it
   * covers that call. Requires the lease still to be ours: if another worker
   * has taken the row, this one must not call One.
   */
  private async setMarker(
    id: string,
    leaseToken: string,
    step: MailboxDeliveryStepEnum,
    extra: { pdfSha256?: string; pdfSizeBytes?: number } = {},
  ): Promise<void> {
    const [count] = await this.deliveryModel.update(
      { inFlightStep: step, leaseExpiresAt: LEASE_EXPIRY, ...extra },
      { where: { id, leaseToken }, transaction: null },
    )
    if (count === 0) {
      throw new InternalServerErrorException(
        `Lost the lease on mailbox delivery ${id} before ${step}`,
      )
    }
  }

  private async release(id: string, leaseToken: string): Promise<void> {
    try {
      await this.deliveryModel.update(
        { leaseToken: null, leaseExpiresAt: null },
        { where: { id, leaseToken }, transaction: null },
      )
    } catch (error) {
      // The work is recorded; the lease simply expires.
      this.logger.warn(
        `Could not release the lease on mailbox delivery ${id}`,
        {
          context: LOGGING_CONTEXT,
          deliveryId: id,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  /**
   * Records FAILED or UNCERTAIN, clears the marker and releases the lease in one
   * write. If this write itself fails, the marker (if any) stays in the row, so
   * the next claim still finds the row UNCERTAIN.
   */
  private async recordFailure(
    id: string,
    leaseToken: string,
    outcome: MailboxDeliveryStatusEnum,
    step: MailboxDeliveryStepEnum | null,
    error: unknown,
  ): Promise<void> {
    this.logger.error(
      `Mailbox delivery ${id} ${outcome}${step ? ` during ${step}` : ''}`,
      {
        context: LOGGING_CONTEXT,
        deliveryId: id,
        outcome,
        step,
        operation: isOneSystemsError(error) ? error.operation : undefined,
        reason: isOneSystemsError(error) ? error.reason : undefined,
        upstreamStatus: isOneSystemsError(error)
          ? error.upstreamStatus
          : undefined,
        errorNumber: isOneSystemsError(error) ? error.errorNumber : undefined,
      },
    )

    try {
      const [count] = await this.deliveryModel.update(
        {
          status: outcome,
          inFlightStep: null,
          lastError: describeError(error),
          lastErrorNumber: isOneSystemsError(error) ? error.errorNumber : null,
          leaseToken: null,
          leaseExpiresAt: null,
        },
        { where: { id, leaseToken }, transaction: null },
      )
      if (count === 0) {
        this.logger.warn(
          `Lost the lease on mailbox delivery ${id}; its ${outcome} was not recorded`,
          { context: LOGGING_CONTEXT, deliveryId: id },
        )
      }
    } catch (writeError) {
      this.logger.error(
        `Could not record the failure of mailbox delivery ${id}`,
        {
          context: LOGGING_CONTEXT,
          deliveryId: id,
          message:
            writeError instanceof Error
              ? writeError.message
              : String(writeError),
        },
      )
    }
  }
}

/**
 * The text kept in `last_error`. `OneSystemsError` messages are written by the
 * client and never carry a token or password.
 */
function describeError(error: unknown): string {
  let text: string
  if (isOneSystemsError(error)) {
    const status = error.upstreamStatus ? ` ${error.upstreamStatus}` : ''
    text = `${error.operation} ${error.reason}${status}: ${error.errorMessage ?? error.message}`
  } else {
    text = error instanceof Error ? error.message : String(error)
  }
  return text.slice(0, MAX_ERROR_LENGTH)
}
