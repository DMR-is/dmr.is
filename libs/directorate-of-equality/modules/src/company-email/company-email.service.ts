import { getNamespace } from 'cls-hooked'
import { Transaction } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { simpleSanitize } from '@dmr.is/utils-server/cleanLegacyHtml'

import {
  CompanyMailRecipient,
  GetCompaniesQueryDto,
  ICompanyService,
} from '../company/company.service.interface'
import { CompanyStatusEnum } from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import {
  CompanyCustomEmailEventType,
  CompanyEventTypeEnum,
} from '../company/models/company-event.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { IDoeMailService } from '../mail/doe-mail.service.interface'
import { looksLikeOneAddress } from '../mail/recipient'
import { UserModel } from '../user/models/user.model'
import {
  CompanyEmailAttachmentDto,
  CompanyEmailDto,
} from './dto/company-email.dto'
import { CompanyEmailPreviewDto } from './dto/company-email-preview.dto'
import { PresignCompanyEmailAttachmentDto } from './dto/presign-company-email-attachment.dto'
import {
  MAX_ATTACHMENTS,
  SendCompanyEmailDto,
} from './dto/send-company-email.dto'
import { SendCompanyEmailResponseDto } from './dto/send-company-email-response.dto'
import {
  CompanyEmailRecipientStatusEnum,
  CompanyEmailStatusEnum,
} from './models/company-email.enums'
import { CompanyEmailModel } from './models/company-email.model'
import { CompanyEmailAttachmentModel } from './models/company-email-attachment.model'
import { CompanyEmailRecipientModel } from './models/company-email-recipient.model'
import { companyEmailMessages } from './company-email.messages'
import { ICompanyEmailService } from './company-email.service.interface'

const LOGGING_CONTEXT = 'CompanyEmailService'

const ONE_MB = 1024 * 1024

/**
 * Total raw bytes of attachments on one message.
 *
 * ⚠️ Not an arbitrary number. SES rejects a message over 10MB *after* MIME
 * encoding, and base64 inflates by ~33%, so ~7.5MB of raw file is the real
 * ceiling. 5MB leaves room for the body and headers, and leaves the failure —
 * if it comes — on this side of the boundary, where it is a clear 400 rather
 * than an opaque rejection on every one of a thousand sends.
 */
const MAX_ATTACHMENT_TOTAL_BYTES = ONE_MB * 5

/** Per-file cap, so one oversized file is rejected on its own terms. */
const MAX_SINGLE_ATTACHMENT_BYTES = MAX_ATTACHMENT_TOTAL_BYTES

/**
 * Where the durable copy of an attachment lives once the batch has gone out.
 *
 * Deliberately the company-files bucket rather than the import-staging one: the
 * schema draws that line between "inbound, client-uploaded, transient" and
 * "outbound documents the Directorate issued", and by the time a batch has been
 * sent an attachment is unambiguously the second. It is the same bucket the
 * approval mail's PDFs are archived to, for the same reason.
 */
const archiveBucket = (): string | undefined =>
  process.env.AWS_DOE_COMPANY_FILES_BUCKET?.trim() || undefined

/** How the recipient's own status maps onto the event written to its timeline. */
const EVENT_FOR_STATUS: Record<
  CompanyEmailRecipientStatusEnum,
  CompanyCustomEmailEventType | null
> = {
  [CompanyEmailRecipientStatusEnum.SENT]: CompanyEventTypeEnum.CUSTOM_EMAIL_SENT,
  [CompanyEmailRecipientStatusEnum.FAILED]:
    CompanyEventTypeEnum.CUSTOM_EMAIL_FAILED,
  [CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL]:
    CompanyEventTypeEnum.CUSTOM_EMAIL_SKIPPED,
  [CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED]:
    CompanyEventTypeEnum.CUSTOM_EMAIL_SKIPPED,
  // Nothing has happened yet, so there is nothing to record.
  [CompanyEmailRecipientStatusEnum.PENDING]: null,
}

/** English detail appended to the timeline entry for the non-delivery outcomes. */
const SKIP_DETAIL: Partial<Record<CompanyEmailRecipientStatusEnum, string>> = {
  [CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL]: 'ekkert netfang skráð',
  [CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED]: 'fyrirtæki í sóttkví',
}

/** A recipient as resolved, before any row is written. */
type ResolvedRecipient = {
  companyId: string
  companyName: string
  email: string | null
  status: CompanyEmailRecipientStatusEnum
}

@Injectable()
export class CompanyEmailService implements ICompanyEmailService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(IDoeMailService) private readonly mailService: IDoeMailService,
    @Inject(IImportUploadService)
    private readonly uploadService: IImportUploadService,
    @Inject(IAWSService) private readonly aws: IAWSService,
    @InjectModel(CompanyEmailModel)
    private readonly companyEmailModel: typeof CompanyEmailModel,
    @InjectModel(CompanyEmailRecipientModel)
    private readonly recipientModel: typeof CompanyEmailRecipientModel,
    @InjectModel(CompanyEmailAttachmentModel)
    private readonly attachmentModel: typeof CompanyEmailAttachmentModel,
  ) {}

  async presignAttachment(
    dto: PresignCompanyEmailAttachmentDto,
  ): Promise<PresignUploadResponseDto> {
    // Only the extension travels into the key; the rest of the name is server
    // generated. The name the recipient sees is sent with the message, so
    // nothing here has to survive as a file name — and no key anywhere is built
    // from `filename`, including the archive one. See `archiveAttachments`.
    const extension = dto.filename.split('.').pop() ?? ''

    return this.uploadService.createUpload(
      ImportUploadBoundary.MAIL_ATTACHMENT,
      { extension },
    )
  }

  async preview(dto: SendCompanyEmailDto): Promise<CompanyEmailPreviewDto> {
    const resolved = await this.resolveRecipients(dto)

    const recipients = resolved.filter(
      (r) => r.status === CompanyEmailRecipientStatusEnum.PENDING,
    )
    const skipped = resolved.filter(
      (r) => r.status !== CompanyEmailRecipientStatusEnum.PENDING,
    )

    return {
      /*
       * ⚠️ Sanitised here, with the identical pass `send` runs on the identical
       * input, so the confirmation step renders the bytes that will actually be
       * delivered. Echoing `dto.bodyHtml` back instead would let an admin
       * approve markup that sanitise-html strips on the way out.
       */
      bodyHtml: simpleSanitize(dto.bodyHtml),
      recipients: recipients.map(({ companyId, companyName, email }) => ({
        companyId,
        companyName,
        email,
      })),
      skipped: skipped.map(({ companyId, companyName, email, status }) => ({
        companyId,
        companyName,
        email,
        reason: status,
      })),
      recipientCount: recipients.length,
      skippedCount: skipped.length,
    }
  }

  async send(
    dto: SendCompanyEmailDto,
    actorUserId: string,
  ): Promise<SendCompanyEmailResponseDto> {
    const resolved = await this.resolveRecipients(dto)

    const deliverable = resolved.filter(
      (r) => r.status === CompanyEmailRecipientStatusEnum.PENDING,
    )

    /*
     * Nothing to deliver — either nothing matched, or everything that did is
     * quarantined or has no address on file. Refused rather than accepted as an
     * empty batch: a 202 would tell the admin the message was on its way when
     * no one is ever going to receive it. The modal disables the button in this
     * state, so reaching here means a direct API call.
     */
    if (deliverable.length === 0) {
      throw new BadRequestException(companyEmailMessages.noRecipients())
    }

    const attachments = dto.attachments ?? []
    if (attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException(
        companyEmailMessages.tooManyAttachments(MAX_ATTACHMENTS),
      )
    }

    /*
     * ⚠️ Attachments are fetched here, in the request, and NOT in the background
     * loop — even though the loop is where they are used.
     *
     * The size cap is only enforceable by reading the objects, and a cap
     * enforced after the request has returned 202 has nothing to reject to: the
     * admin has already been told the send was accepted. Reading them now turns
     * "these files are too big" into a 400 they can act on, and means the loop
     * starts with buffers in hand rather than a storage dependency it might
     * fail on halfway through a thousand recipients.
     */
    const buffers = await this.fetchAttachments(attachments)

    // Sanitised before it is stored, and the delivered message and the timeline
    // read-back both read this stored value. `preview` runs the same pass over
    // the same input, so what the admin approved and what is stored here are
    // the same bytes.
    const bodyHtml = simpleSanitize(dto.bodyHtml)

    const batch = await this.companyEmailModel.create({
      subject: dto.subject,
      bodyHtml,
      createdByUserId: actorUserId,
      status: CompanyEmailStatusEnum.QUEUED,
      filter: dto.filter
        ? (JSON.parse(JSON.stringify(dto.filter)) as Record<string, unknown>)
        : null,
    })

    await this.recipientModel.bulkCreate(
      resolved.map((recipient) => ({
        companyEmailId: batch.id,
        companyId: recipient.companyId,
        companyName: recipient.companyName,
        email: recipient.email,
        status: recipient.status,
      })),
    )

    if (attachments.length) {
      await this.attachmentModel.bulkCreate(
        attachments.map((attachment, index) => ({
          companyEmailId: batch.id,
          filename: attachment.filename,
          s3Key: attachment.key,
          sizeBytes: buffers[index].length,
        })),
      )
    }

    const recipientCount = deliverable.length

    /*
     * ⚠️ After the commit, not inside it. The loop reads the rows written above
     * through its own queries, so starting it before they are visible would have
     * it find an empty batch and complete having sent nothing.
     */
    await this.runAfterCommit(`company email ${batch.id}`, () =>
      this.deliver(
        batch.id,
        dto.subject,
        bodyHtml,
        attachments,
        buffers,
        actorUserId,
      ),
    )

    this.logger.info('Queued company email', {
      context: LOGGING_CONTEXT,
      companyEmailId: batch.id,
      recipientCount,
      skippedCount: resolved.length - recipientCount,
      attachmentCount: attachments.length,
    })

    return {
      id: batch.id,
      recipientCount,
      skippedCount: resolved.length - recipientCount,
    }
  }

  async getById(id: string): Promise<CompanyEmailDto> {
    const batch = await this.companyEmailModel.findOneOrThrow(
      {
        where: { id },
        include: [
          { model: UserModel, as: 'createdBy', required: false },
          {
            model: CompanyEmailAttachmentModel,
            as: 'attachments',
            required: false,
          },
        ],
      },
      companyEmailMessages.notFound(id),
    )

    const counts = await this.countByStatus(id)

    const attachments: CompanyEmailAttachmentDto[] = (
      batch.attachments ?? []
    ).map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      sizeBytes: attachment.sizeBytes,
    }))

    return {
      id: batch.id,
      subject: batch.subject,
      bodyHtml: batch.bodyHtml,
      status: batch.status,
      createdByName: batch.createdBy
        ? `${batch.createdBy.firstName} ${batch.createdBy.lastName}`
        : null,
      sentCount: counts[CompanyEmailRecipientStatusEnum.SENT],
      failedCount: counts[CompanyEmailRecipientStatusEnum.FAILED],
      skippedCount:
        counts[CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL] +
        counts[CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED],
      pendingCount: counts[CompanyEmailRecipientStatusEnum.PENDING],
      attachments,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    }
  }

  /**
   * Turn "who should get this" into a concrete, classified list.
   *
   * ⚠️ Every matched company appears in the result, including the ones that will
   * receive nothing. Filtering the excluded ones out here is the tempting
   * simplification and the wrong one: the preview has to be able to say *why*
   * the count an admin saw on the button is larger than the count of people who
   * will be written to, and a list that has already dropped them cannot.
   */
  private async resolveRecipients(
    dto: SendCompanyEmailDto,
  ): Promise<ResolvedRecipient[]> {
    const companyIds = dto.companyIds?.length ? dto.companyIds : undefined
    const filter = dto.filter

    // Exclusive, and one is required. Both-or-neither is the same misuse from
    // the admin's side — see `recipientsNotSpecified`. Narrowing on the values
    // rather than on two booleans is what lets the branch below type-check
    // without an assertion.
    if (!!companyIds === !!filter) {
      throw new BadRequestException(
        companyEmailMessages.recipientsNotSpecified(),
      )
    }

    const companies = companyIds
      ? await this.companyService.findMailRecipientsByIds(companyIds)
      : await this.companyService.findMailRecipientsByFilter(
          filter as GetCompaniesQueryDto,
        )

    /*
     * The single-company override. Offered only when exactly one company is
     * addressed, because there is otherwise no one address it could mean — and
     * silently applying one admin-typed address to a thousand companies is the
     * kind of mistake that cannot be taken back.
     */
    const override =
      companies.length === 1 ? dto.recipientEmail?.trim() || null : null

    return companies.map((company) => classify(company, override))
  }

  /**
   * Read the staged attachments and enforce the size caps.
   *
   * Fetches through the mail-attachment boundary, so a caller-supplied key
   * outside that prefix is refused before it reaches storage — the keys arrive
   * from the client, and this is what stops one being pointed at an import
   * workbook or an arbitrary object.
   */
  private async fetchAttachments(
    attachments: { key: string; filename: string }[],
  ): Promise<Buffer[]> {
    const buffers: Buffer[] = []
    let total = 0

    for (const attachment of attachments) {
      let buffer: Buffer
      try {
        buffer = await this.uploadService.fetchObject(
          attachment.key,
          ImportUploadBoundary.MAIL_ATTACHMENT,
          MAX_SINGLE_ATTACHMENT_BYTES,
        )
      } catch (error) {
        this.logger.warn('Could not read a staged mail attachment', {
          context: LOGGING_CONTEXT,
          filename: attachment.filename,
          errorMessage: error instanceof Error ? error.message : String(error),
        })

        /*
         * Separated because the staging PUT is capped at the import limit, well
         * above this one — so an oversized attachment is a routine outcome
         * here, not a storage fault. Reporting it as unreadable would send the
         * admin looking for a corrupt file instead of a smaller one.
         */
        if (error instanceof PayloadTooLargeException) {
          throw new BadRequestException(
            companyEmailMessages.attachmentsTooLarge(
              MAX_ATTACHMENT_TOTAL_BYTES,
            ),
          )
        }

        throw new BadRequestException(
          companyEmailMessages.attachmentUnreadable(attachment.filename),
        )
      }

      total += buffer.length
      // Checked as the running total rather than only at the end, so five files
      // just under the per-file cap cannot together clear it.
      if (total > MAX_ATTACHMENT_TOTAL_BYTES) {
        throw new BadRequestException(
          companyEmailMessages.attachmentsTooLarge(MAX_ATTACHMENT_TOTAL_BYTES),
        )
      }

      buffers.push(buffer)
    }

    return buffers
  }

  /**
   * Walk the batch and send it. Runs detached, after the request has returned.
   *
   * ⚠️ **Serially, one `await` per recipient.** Not a missed optimisation: SES
   * enforces a per-second send quota, and a parallel fan-out over the register
   * would breach it and start collecting throttling rejections — turning a
   * pacing problem into a thousand failed sends. The reminder task walks its
   * companies the same way for the same reason.
   */
  private async deliver(
    companyEmailId: string,
    subject: string,
    bodyHtml: string,
    attachments: { key: string; filename: string }[],
    buffers: Buffer[],
    actorUserId: string,
  ): Promise<void> {
    try {
      /*
       * ⚠️ Read the status BEFORE claiming it, to tell a first run from a resume.
       *
       * It decides whether the rows that were skipped at resolve time still need
       * their timeline entry. On a first run they do — nothing has written one
       * yet, and a company that was deliberately not written to is precisely the
       * outcome an admin needs to see. On a resume they do not, and emitting
       * again would double every skip entry.
       */
      const existing = await this.companyEmailModel.findOne({
        where: { id: companyEmailId },
        attributes: ['status'],
      })
      const isFirstRun = existing?.status !== CompanyEmailStatusEnum.SENDING

      await this.companyEmailModel.update(
        { status: CompanyEmailStatusEnum.SENDING },
        { where: { id: companyEmailId } },
      )

      const mailAttachments = attachments.map((attachment, index) => ({
        filename: attachment.filename,
        content: buffers[index],
        label: attachment.filename,
      }))

      /*
       * The company's register status is joined here, once for the batch, and
       * not read per recipient: `emitOutcome` has to record the status the
       * event happened under, the way every other emitter on
       * `ICompanyEventService` does, and a filter with no `status` constraint
       * matches INACTIVE companies too — so a constant would write a false
       * value onto an immutable timeline row.
       */
      const rows = await this.recipientModel.findAll({
        where: { companyEmailId },
        include: [
          {
            model: CompanyModel,
            as: 'company',
            attributes: ['id', 'status'],
            required: false,
          },
        ],
        order: [['companyName', 'ASC']],
      })

      for (const row of rows) {
        await this.deliverOne(
          row,
          companyEmailId,
          subject,
          bodyHtml,
          mailAttachments,
          actorUserId,
          isFirstRun,
        )
      }

      await this.companyEmailModel.update(
        {
          status: CompanyEmailStatusEnum.COMPLETED,
          completedAt: new Date(),
        },
        { where: { id: companyEmailId } },
      )

      await this.archiveAttachments(companyEmailId)

      this.logger.info('Finished sending company email', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        recipientCount: rows.length,
      })
    } catch (error) {
      /*
       * Reached only by a fault that is not one recipient's — the database going
       * away, or the status update itself failing. A single failed *send* is
       * handled per row and never lands here, which is the distinction that
       * matters: one bad address must not stop the other 1 699 messages, and a
       * database that has stopped answering must not be walked for another hour
       * writing rows that will never commit.
       */
      this.logger.error('Company email batch aborted', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        errorMessage: error instanceof Error ? error.message : String(error),
      })

      // Best-effort: if the database is what failed, this will fail too, and the
      // batch is left in SENDING — which is itself the signal that it stopped
      // partway, with its PENDING rows naming exactly what never went out.
      await this.companyEmailModel
        .update(
          { status: CompanyEmailStatusEnum.FAILED, completedAt: new Date() },
          { where: { id: companyEmailId } },
        )
        .catch(() => undefined)
    }
  }

  /** One recipient: send if it should be sent, then record what happened. */
  private async deliverOne(
    row: CompanyEmailRecipientModel,
    companyEmailId: string,
    subject: string,
    bodyHtml: string,
    mailAttachments: { filename: string; content: Buffer; label: string }[],
    actorUserId: string,
    isFirstRun: boolean,
  ): Promise<void> {
    /*
     * Already terminal: either a skip decided when the batch was resolved, or a
     * row a previous partial run finished. Nothing is sent either way — but on a
     * first run the skip still needs its timeline entry, because nothing has
     * written one yet and "we deliberately did not write to this company" is the
     * outcome an admin most needs to see. On a resume the entry already exists.
     */
    if (row.status !== CompanyEmailRecipientStatusEnum.PENDING) {
      if (isFirstRun) {
        await this.emitOutcome(
          row,
          companyEmailId,
          subject,
          row.status,
          null,
          actorUserId,
        )
      }
      return
    }

    let status: CompanyEmailRecipientStatusEnum
    let error: string | null = null

    if (!row.email) {
      // Belt and braces — `classify` already routes an address-less company to
      // SKIPPED_NO_EMAIL, so reaching this means the row was written by
      // something that did not.
      status = CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL
    } else {
      const result = await this.mailService.sendCustomEmail(
        row.email,
        subject,
        bodyHtml,
        mailAttachments,
      )

      status = result.ok
        ? CompanyEmailRecipientStatusEnum.SENT
        : CompanyEmailRecipientStatusEnum.FAILED
      error = result.ok ? null : result.error
    }

    await row.update({
      status,
      error,
      sentAt: status === CompanyEmailRecipientStatusEnum.SENT ? new Date() : null,
    })

    await this.emitOutcome(
      row,
      companyEmailId,
      subject,
      status,
      error,
      actorUserId,
    )
  }

  /**
   * Write the company's timeline entry for its outcome.
   *
   * Failures here are swallowed: the message has already gone out (or already
   * definitively not), and losing the audit line for one company must not abort
   * a batch that is still delivering to the rest. It is logged at `error` so the
   * gap is discoverable rather than silent.
   */
  private async emitOutcome(
    row: CompanyEmailRecipientModel,
    companyEmailId: string,
    subject: string,
    status: CompanyEmailRecipientStatusEnum,
    error: string | null,
    actorUserId: string,
  ): Promise<void> {
    const eventType = EVENT_FOR_STATUS[status]
    if (!eventType) return

    try {
      await this.companyEventService.emitCustomEmailOutcome(
        row.companyId,
        // Joined onto the row in `deliver`. Falls back only if the company row
        // has gone, which the foreign key does not allow.
        row.company?.status ?? CompanyStatusEnum.ACTIVE,
        eventType,
        companyEmailId,
        subject,
        // The reviewer who sent it. Carried down from the request rather than
        // left null so the timeline reads "Jóna sendi tölvupóst" — an outbound
        // message with no name against it is exactly the audit entry that
        // prompts the question this column answers.
        actorUserId,
        error ?? SKIP_DETAIL[status] ?? null,
      )
    } catch (eventError) {
      this.logger.error('Could not record company email outcome on timeline', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        companyId: row.companyId,
        errorMessage:
          eventError instanceof Error ? eventError.message : String(eventError),
      })
    }
  }

  /**
   * Move each attachment from the transient staging prefix to the durable
   * company-files bucket, once the batch has gone out.
   *
   * ⚠️ **If the archive bucket is unset, nothing is moved and nothing is
   * deleted.** `AWS_DOE_COMPANY_FILES_BUCKET` is deliberately optional and is
   * not provisioned yet — `CompanyFileService` treats unset as "archiving is
   * off" and carries on. Copying that behaviour naively here would mean deleting
   * the staged object with nowhere to have put it, destroying the only copy of a
   * file that was genuinely sent to companies. So the staged object is kept
   * instead, and there is exactly one durable copy either way.
   *
   * Best-effort throughout, like `ICompanyFileService.archive`: the mail is
   * already delivered, and a storage failure must not be reported as a failed
   * send.
   */
  private async archiveAttachments(companyEmailId: string): Promise<void> {
    const bucket = archiveBucket()
    const rows = await this.attachmentModel.findAll({
      where: { companyEmailId, archived: false },
    })

    if (!rows.length) return

    if (!bucket) {
      this.logger.warn(
        'Not archiving company email attachments — AWS_DOE_COMPANY_FILES_BUCKET is not set, so the staged objects are being kept as the only copy',
        { context: LOGGING_CONTEXT, companyEmailId, count: rows.length },
      )
      return
    }

    for (const row of rows) {
      // ⚠️ Captured before the row is updated. `row.update` mutates `s3Key` in
      // place, so reading it again after the update would hand `cleanupAfter`
      // the *archive* key — which sits outside the mail-attachment prefix, is
      // refused by the boundary check, and leaves the staged object behind
      // forever while logging a misleading "outside its prefix" warning.
      const stagedKey = row.s3Key

      try {
        const buffer = await this.uploadService.fetchObject(
          stagedKey,
          ImportUploadBoundary.MAIL_ATTACHMENT,
          MAX_SINGLE_ATTACHMENT_BYTES,
        )

        /*
         * One copy per batch under the message's own prefix — NOT one per
         * company. See the note on `CompanyEmailAttachmentModel`.
         *
         * ⚠️ Keyed by the staged basename — which the boundary pattern has
         * already proven to be a server-generated `<uuid>.<ext>` — and not by
         * `row.filename`. Two attachments on one message may carry the same
         * name, which would collapse them onto a single key and leave the
         * second overwriting the only durable copy of the first.
         */
        const stagedName = stagedKey.slice(stagedKey.lastIndexOf('/') + 1)
        const key = `company-emails/${companyEmailId}/${stagedName}`

        // The name the recipient sees, minus the characters that would break
        // out of the unescaped `Content-Disposition` header `uploadObject`
        // builds. The stored `filename` itself is left as the admin typed it.
        const headerName = row.filename.replace(/["\\/]|\p{Cc}/gu, '')

        const uploaded = await this.aws.uploadObject(
          bucket,
          key,
          headerName,
          buffer,
        )

        if (uploaded.result.ok === false) {
          this.logger.warn('Failed to archive a company email attachment', {
            context: LOGGING_CONTEXT,
            companyEmailId,
            errorMessage: uploaded.result.error.message,
          })
          continue
        }

        // Row first, delete second. If the delete fails the row still points at
        // a real object in the archive bucket; the reverse order could leave the
        // row pointing at a staged object that is already gone.
        await row.update({ s3Key: key, archived: true })
        await this.uploadService.cleanupAfter(
          stagedKey,
          ImportUploadBoundary.MAIL_ATTACHMENT,
        )
      } catch (error) {
        this.logger.warn('Failed to archive a company email attachment', {
          context: LOGGING_CONTEXT,
          companyEmailId,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  /** Recipient counts per status, with every status present as zero. */
  private async countByStatus(
    companyEmailId: string,
  ): Promise<Record<CompanyEmailRecipientStatusEnum, number>> {
    const counts = Object.fromEntries(
      Object.values(CompanyEmailRecipientStatusEnum).map((status) => [
        status,
        0,
      ]),
    ) as Record<CompanyEmailRecipientStatusEnum, number>

    const rows = await this.recipientModel.findAll({
      where: { companyEmailId },
      attributes: ['status'],
    })

    for (const row of rows) {
      counts[row.status] += 1
    }

    return counts
  }

  /**
   * Run `work` once the ambient transaction commits, or immediately when there
   * is none.
   *
   * Lifted from `ReportWorkflowService`, which needs the same thing for the same
   * reason. The no-transaction branch keeps unit tests and any caller outside
   * the HTTP pipeline working, where the old inline behaviour is the correct one.
   */
  private async runAfterCommit(
    label: string,
    work: () => Promise<void>,
  ): Promise<void> {
    const transaction = getNamespace(CLS_NAMESPACE)?.get('transaction') as
      | Transaction
      | undefined

    if (!transaction) {
      await work()
      return
    }

    transaction.afterCommit(async () => {
      try {
        await work()
      } catch (error) {
        this.logger.error(`Post-commit ${label} failed`, {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    })
  }
}

/**
 * Decide, up front, what will happen to one company.
 *
 * Quarantine is checked **before** the address, and the order is deliberate: a
 * quarantined company with no email on file should read as quarantined, because
 * that is the fact an admin needs to act on. Reporting it as "no address" would
 * send them off to fill in an address for a company that is halted anyway.
 */
const classify = (
  company: CompanyMailRecipient,
  overrideEmail: string | null,
): ResolvedRecipient => {
  const base = { companyId: company.id, companyName: company.name }

  if (company.quarantined) {
    return {
      ...base,
      email: overrideEmail ?? company.email,
      status: CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED,
    }
  }

  const candidate = overrideEmail ?? company.email

  // `looksLikeOneAddress`, not an email regex. It rejects comma- and
  // semicolon-separated lists, which nodemailer would otherwise split — sending
  // one company's message to every address in the field. See `recipient.ts`.
  if (!candidate || !looksLikeOneAddress(candidate)) {
    return {
      ...base,
      email: null,
      status: CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL,
    }
  }

  return {
    ...base,
    email: candidate,
    status: CompanyEmailRecipientStatusEnum.PENDING,
  }
}
