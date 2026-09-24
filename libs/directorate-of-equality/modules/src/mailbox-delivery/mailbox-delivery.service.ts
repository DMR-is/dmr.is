import { createHash, randomUUID } from 'crypto'
import { literal, Op, WhereOptions } from 'sequelize'

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
  type OneSystemsOperation,
  oneSystemsTimeoutMs,
  toLoggableErrorNumber,
} from '@dmr.is/clients-onesystems'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import {
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from './models/mailbox-delivery.enums'
import { MailboxDeliveryModel } from './models/mailbox-delivery.model'
import {
  buildMailboxDeliveryIdempotencyKey,
  mailboxDeliveryIdempotencyKeyPrefix,
} from './mailbox-delivery.idempotency-key'
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

const MINUTE_MS = 60_000

/**
 * The longest one call to One can hold a row, derived from the client's own
 * timeouts. A call is a lazy Login and the action; a 401 then costs a second
 * Login and one retried action, each with its own full timeout. The 401 can
 * arrive at the very end of the first action's timeout, so the worst case is
 * 2 x (Login + action) for the slowest action. CreateDocument and
 * SendDocToIslandIs both get 120s, and both still retry once on the JwtBearer
 * challenge: 2 x (30s + 120s) = 5 min. CreateCase's is 2 x (30s + 30s).
 * A timeout is never retried, so nothing is longer.
 */
export const MAILBOX_DELIVERY_SLOWEST_CALL_MS =
  2 *
  (oneSystemsTimeoutMs('Login') +
    Math.max(
      oneSystemsTimeoutMs('CreateCase'),
      oneSystemsTimeoutMs('CreateDocument'),
      oneSystemsTimeoutMs('SendDocToIslandIs'),
    ))

/**
 * Headroom over {@link MAILBOX_DELIVERY_SLOWEST_CALL_MS} for the work between
 * two marker writes that is not a call to One: the PDF render and the state
 * writes around it.
 */
const LEASE_MARGIN_MS = 2 * MINUTE_MS

/**
 * How long a claim on a row lasts: the slowest call plus the margin, rounded
 * up to whole minutes (7 with today's timeouts). It is renewed each time a
 * marker is written, so it only has to cover one call to One, or the claim's
 * CreateCase and the render before the first marker. A lease shorter than a
 * call lets another worker take the row mid-call and mark it UNCERTAIN.
 */
export const MAILBOX_DELIVERY_LEASE_MINUTES = Math.ceil(
  (MAILBOX_DELIVERY_SLOWEST_CALL_MS + LEASE_MARGIN_MS) / MINUTE_MS,
)

/**
 * `last_error` is for a person reconciling the row. It may hold One's own
 * `ErrorMessage`, which can echo the recipient's details, so it is kept short.
 */
const MAX_ERROR_LENGTH = 500

/** Evaluated by Postgres, so every worker compares leases on one clock. */
const NOW = literal('CURRENT_TIMESTAMP')
const LEASE_EXPIRY = literal(
  `CURRENT_TIMESTAMP + INTERVAL '${MAILBOX_DELIVERY_LEASE_MINUTES} minutes'`,
)

/**
 * The column that says a step's result is saved. For the send it is `sentAt`,
 * never `islandIsDocumentId`: One may confirm a send without an `ItemID`, so a
 * SENT row can have a NULL `island_is_document_id`.
 */
const SAVED_WHEN_SET = {
  [MailboxDeliveryStepEnum.CREATE_DOCUMENT]: 'oneDocumentItemId',
  [MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS]: 'sentAt',
} as const satisfies Record<MailboxDeliveryStepEnum, keyof MailboxDeliveryModel>

const STEP_OPERATION = {
  [MailboxDeliveryStepEnum.CREATE_DOCUMENT]: 'CreateDocument',
  [MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS]: 'SendDocToIslandIs',
} as const satisfies Record<MailboxDeliveryStepEnum, OneSystemsOperation>

type StepResult =
  | { oneDocumentItemId: string }
  | { islandIsDocumentId: string | null; sentAt: Date }

type DeliveryCompany = Pick<CompanyModel, 'id' | 'name' | 'nationalId'>

/**
 * Delivers notices to island.is mailboxes through One, resumably.
 *
 * ⚠️ Every query passes `transaction: null`. That takes it out of the ambient
 * CLS transaction and makes it an autocommitted statement of its own. A
 * caller's rollback must not erase the record of a case, document or send One
 * has already made, or the next attempt would make it again. Do not put these
 * writes in a `sequelize.transaction()` of their own either: under CLS that is
 * a second connection with a real COMMIT, not a nested savepoint.
 *
 * Resume is driven by the saved ids and `sent_at`, not by `status`:
 * - CreateCase is assumed to find-or-create, so repeating it is taken to be
 *   harmless and it has no marker. Any failure of it leaves the row FAILED
 *   (retryable). TODO(OneSystems): the spec does not document find-or-create;
 *   if it is not, a retry leaves an orphan case in One (never a second send).
 *   A case id that loses the race to be saved is logged for that reason.
 * - CreateDocument and SendDocToIslandIs are not safe to repeat. Each is
 *   preceded by an `in_flight_step` marker. A failure that
 *   `isDefinitiveOneSystemsFailure` says never reached the action leaves the
 *   row FAILED; anything else leaves it UNCERTAIN, which nothing retries. A
 *   marker still set when the row is next claimed means the process died
 *   mid-call, and the row becomes UNCERTAIN then.
 * - Each id One returns is logged the moment the call returns, then written
 *   only while the step's result is unsaved (`one_document_item_id` /
 *   `sent_at` IS NULL), without requiring the lease, so an id One returned is
 *   saved even after the lease lapsed and is never overwritten by a second
 *   one. The write never moves a row out of UNCERTAIN: a person has been told
 *   to check One, and the saved id is their evidence.
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
    // Before the kill switch too, so a caller's malformed key fails in every
    // environment, not first on the day delivery is switched on.
    assertCanonicalKey(input, input.companyId.toLowerCase())

    if (process.env.ONESYSTEMS_ENABLED !== 'true') {
      return { status: 'DISABLED' }
    }

    // Before any row or call, so a missing classification never leaves a
    // half-started delivery behind.
    const config = resolveKindConfig(input.kind, this.kindConfigs)

    // UUIDs compare case-insensitively in Postgres; lowercase it to match the
    // id the key was checked against above.
    const companyId = input.companyId.toLowerCase()
    const company = await this.companyModel.findOne({
      where: { id: companyId },
      attributes: ['id', 'name', 'nationalId'],
      transaction: null,
    })
    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found`)
    }

    // Again against the id the DB handed back, which is the one stored.
    assertCanonicalKey(input, company.id)

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
      return this.markInterrupted(claimed, claimed.inFlightStep, leaseToken)
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

    if (row.companyId !== company.id || row.kind !== input.kind) {
      throw new ConflictException(
        `Idempotency key already used by delivery ${row.id} for a different company or kind`,
      )
    }

    return row
  }

  /**
   * The result for a row that needs no work, or null if it needs some.
   *
   * UNCERTAIN wins, even over a saved `sent_at`: a late reply may have saved
   * the send's result into a row a person has already been told to check.
   * Otherwise a row is sent when its status is SENT or `sent_at` is set;
   * `island_is_document_id` says nothing, since One may confirm a send
   * without an id. `mailbox_delivery_sent_at_chk` already forbids `sent_at` on
   * any other status; the `sentAt` test is kept as defence in depth.
   */
  private settledResult(
    row: MailboxDeliveryModel,
  ): DeliverToMailboxResult | null {
    if (row.status === MailboxDeliveryStatusEnum.UNCERTAIN) {
      return { status: 'UNCERTAIN', deliveryId: row.id }
    }
    if (row.status === MailboxDeliveryStatusEnum.SENT || row.sentAt) {
      return {
        status: 'SENT',
        deliveryId: row.id,
        islandIsDocumentId: row.islandIsDocumentId ?? null,
        sentAt: row.sentAt,
        alreadySent: true,
      }
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

  /**
   * A marker left by a process that died mid-call: the outcome is unknown.
   *
   * Matches the marker as well as the lease. If that call was merely slow and
   * its late save cleared the marker between the claim and this write, nothing
   * is uncertain: the lease is handed back and the row's current result is
   * returned (IN_PROGRESS if it still has work left, which the next call
   * resumes from the saved ids).
   */
  private async markInterrupted(
    row: MailboxDeliveryModel,
    step: MailboxDeliveryStepEnum,
    leaseToken: string,
  ): Promise<DeliverToMailboxResult> {
    const [count] = await this.deliveryModel.update(
      {
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        inFlightStep: null,
        lastError: `Interrupted during ${step}: whether One acted is unknown`,
        lastErrorNumber: null,
        leaseToken: null,
        leaseExpiresAt: null,
      },
      {
        where: { id: row.id, leaseToken, inFlightStep: step },
        transaction: null,
      },
    )

    if (count > 0) {
      this.logger.error(
        `Mailbox delivery ${row.id} was interrupted during ${step}; marked UNCERTAIN`,
        { context: LOGGING_CONTEXT, deliveryId: row.id, step },
      )
      return { status: 'UNCERTAIN', deliveryId: row.id }
    }

    this.logger.warn(
      `Mailbox delivery ${row.id}'s ${step} marker cleared before it could be marked UNCERTAIN`,
      { context: LOGGING_CONTEXT, deliveryId: row.id, step },
    )
    await this.release(row.id, leaseToken)
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
        this.logReturnedId(row.id, 'CreateCase', {
          caseItemId: created.caseItemId,
          caseNumber: created.caseNumber,
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
        this.logReturnedId(row.id, 'CreateDocument', {
          documentItemId: document.documentItemId,
        })
        const saved = await this.saveResult(
          row.id,
          MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          { oneDocumentItemId: document.documentItemId },
          MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
        )
        inFlight = null
        if (saved === 'KEPT_UNCERTAIN') {
          return { status: 'UNCERTAIN', deliveryId: row.id }
        }
        documentItemId = document.documentItemId
      }

      let islandIsDocumentId = row.islandIsDocumentId
      let sentAt = row.sentAt
      if (!sentAt) {
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
        islandIsDocumentId = sent.islandIsDocumentId
        this.logReturnedId(row.id, 'SendDocToIslandIs', {
          islandIsDocumentId,
        })
        const saved = await this.saveResult(
          row.id,
          MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
          { islandIsDocumentId, sentAt },
          MailboxDeliveryStatusEnum.SENT,
        )
        inFlight = null
        if (saved === 'KEPT_UNCERTAIN') {
          return { status: 'UNCERTAIN', deliveryId: row.id }
        }
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
        inFlight && !isDefinitiveFor(inFlight, error)
          ? MailboxDeliveryStatusEnum.UNCERTAIN
          : MailboxDeliveryStatusEnum.FAILED
      await this.recordFailure(row.id, leaseToken, outcome, inFlight, error)
      throw error
    }
  }

  /**
   * Logs what One returned before anything tries to save it, so an id is on
   * record even if the save fails or the process dies. These are One's and
   * island.is's own ids, not personal data.
   */
  private logReturnedId(
    deliveryId: string,
    operation: OneSystemsOperation,
    ids: Record<string, string | null>,
  ): void {
    this.logger.info(`Mailbox delivery ${deliveryId}: ${operation} returned`, {
      context: LOGGING_CONTEXT,
      deliveryId,
      operation,
      ...ids,
    })
  }

  /**
   * Saves the case. If another worker saved one first, its case is kept and
   * used. That assumes CreateCase finds-or-creates, so both name the same case
   * (unconfirmed, TODO(OneSystems)); ours is logged in case it does not.
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
    if (current.oneCaseItemId !== created.caseItemId) {
      this.logger.warn(
        `Mailbox delivery ${id} already had case ${current.oneCaseItemId}; One returned ${created.caseItemId}, which is not used`,
        {
          context: LOGGING_CONTEXT,
          deliveryId: id,
          savedCaseItemId: current.oneCaseItemId,
          discardedCaseItemId: created.caseItemId,
        },
      )
    }
    return current.oneCaseItemId
  }

  /**
   * Writes a step's result, only while the step is unsaved (`SAVED_WHEN_SET`
   * IS NULL), and clears the marker. Not lease-gated, so a result One returned
   * is kept even after the lease lapsed.
   *
   * Never moves a row out of UNCERTAIN: another worker found this call's marker
   * after the lease lapsed and told its caller a person must check One. The
   * result is still saved there as that person's evidence, and
   * `KEPT_UNCERTAIN` is returned.
   *
   * A step already saved means another worker's call got there first; ours is
   * then a duplicate in One, which is logged with its id and thrown.
   */
  private async saveResult(
    id: string,
    step: MailboxDeliveryStepEnum,
    result: StepResult,
    status: MailboxDeliveryStatusEnum,
  ): Promise<'SAVED' | 'KEPT_UNCERTAIN'> {
    const unsaved = { id, [SAVED_WHEN_SET[step]]: null }

    const [count] = await this.deliveryModel.update(
      { ...result, status, inFlightStep: null },
      {
        where: {
          ...unsaved,
          status: { [Op.ne]: MailboxDeliveryStatusEnum.UNCERTAIN },
        } as WhereOptions<MailboxDeliveryModel>,
        transaction: null,
      },
    )
    if (count > 0) {
      return 'SAVED'
    }

    // Nothing moves a row out of UNCERTAIN, so no race between the two writes.
    const [kept] = await this.deliveryModel.update(
      { ...result, inFlightStep: null },
      {
        where: {
          ...unsaved,
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
        } as WhereOptions<MailboxDeliveryModel>,
        transaction: null,
      },
    )
    if (kept > 0) {
      this.logger.warn(
        `Mailbox delivery ${id} is UNCERTAIN; saved ${STEP_OPERATION[step]}'s result and kept the status`,
        { context: LOGGING_CONTEXT, deliveryId: id, step, ...result },
      )
      return 'KEPT_UNCERTAIN'
    }

    this.logger.error(
      `Mailbox delivery ${id} already had ${STEP_OPERATION[step]}'s result; what One just returned is a duplicate in One`,
      { context: LOGGING_CONTEXT, deliveryId: id, step, duplicate: result },
    )
    throw new InternalServerErrorException(
      `Mailbox delivery ${id} already had ${STEP_OPERATION[step]}'s result; One returned a duplicate`,
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
   *
   * Skipped when the step's result is already saved (`SAVED_WHEN_SET`): the
   * save committed but its reply was lost, or another worker's save won. The
   * row then already says what happened, and a SENT row must never become
   * UNCERTAIN. The lease is still released.
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
        errorNumber: isOneSystemsError(error)
          ? toLoggableErrorNumber(error.errorNumber)
          : undefined,
      },
    )

    try {
      const [count] = await this.deliveryModel.update(
        {
          status: outcome,
          inFlightStep: null,
          lastError: describeError(error),
          // The loggable form, never the raw value: an ErrorNumber that could
          // be a kennitala is stored withheld, like it is logged.
          lastErrorNumber: isOneSystemsError(error)
            ? (toLoggableErrorNumber(error.errorNumber) ?? null)
            : null,
          leaseToken: null,
          leaseExpiresAt: null,
        },
        {
          where: step
            ? { id, leaseToken, [SAVED_WHEN_SET[step]]: null }
            : { id, leaseToken },
          transaction: null,
        },
      )
      if (count === 0) {
        this.logger.warn(
          `Mailbox delivery ${id}'s ${outcome} was not recorded: the lease was lost or ${step ?? 'the step'}'s result is already saved`,
          { context: LOGGING_CONTEXT, deliveryId: id, step },
        )
        await this.release(id, leaseToken)
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
 * Refuses a key that is not exactly the one
 * `buildMailboxDeliveryIdempotencyKey` gives for this kind, company and the
 * key's own discriminator. The key is the only guard against a second send,
 * and it is checked only by exact match, so a key in any other spelling
 * (another kind or company, a lower-case or padded discriminator, a
 * hand-built format) is a caller bug that would slip past that guard or trip
 * another delivery's. A part the builder refuses is the same bug.
 */
function assertCanonicalKey(
  input: Pick<DeliverToMailboxInput, 'idempotencyKey' | 'kind'>,
  companyId: string,
): void {
  const prefix = mailboxDeliveryIdempotencyKeyPrefix(input.kind, companyId)
  let canonical: string | null
  try {
    canonical = buildMailboxDeliveryIdempotencyKey({
      kind: input.kind,
      companyId,
      discriminator: input.idempotencyKey.slice(prefix.length),
    })
  } catch {
    canonical = null
  }
  if (input.idempotencyKey !== canonical) {
    throw new InternalServerErrorException(
      'A mailbox delivery idempotency key must be built with buildMailboxDeliveryIdempotencyKey for this kind and company',
    )
  }
}

/**
 * True when One certainly did not act on `step`'s call. Defers to the
 * client's operation-aware `isDefinitiveOneSystemsFailure`, and also requires
 * the error to come from that call (or the Login in front of it), so an error
 * labelled with some other operation is never taken as proof about this one.
 */
function isDefinitiveFor(
  step: MailboxDeliveryStepEnum,
  error: unknown,
): boolean {
  return (
    isOneSystemsError(error) &&
    (error.operation === 'Login' || error.operation === STEP_OPERATION[step]) &&
    isDefinitiveOneSystemsFailure(error)
  )
}

/**
 * The text kept in `last_error` (never logged), cut to `MAX_ERROR_LENGTH`.
 * `OneSystemsError` messages are written by the client and never carry a token
 * or password; One's `errorMessage` may echo input, which this row already
 * holds. It must never be shown in a log or a UI unfiltered.
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
