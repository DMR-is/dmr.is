import { getNamespace } from 'cls-hooked'
import { Transaction } from 'sequelize'

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
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
import { DiscardCompanyEmailAttachmentDto } from './dto/discard-company-email-attachment.dto'
import { PresignCompanyEmailAttachmentDto } from './dto/presign-company-email-attachment.dto'
import {
  MAX_ATTACHMENTS,
  MAX_RECIPIENT_EMAILS,
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
 * SES rejects a message over 10MB after MIME encoding, and base64 inflates by
 * ~33%, so 5MB of raw files leaves room for the body and headers.
 */
const MAX_ATTACHMENT_TOTAL_BYTES = ONE_MB * 5

/** Per-file cap, so one oversized file is rejected on its own terms. */
const MAX_SINGLE_ATTACHMENT_BYTES = MAX_ATTACHMENT_TOTAL_BYTES

/** Durable home for sent attachments — the bucket approval-mail PDFs go to. */
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

/** Detail appended to the timeline entry for the two skip outcomes. */
const SKIP_DETAIL: Partial<Record<CompanyEmailRecipientStatusEnum, string>> = {
  [CompanyEmailRecipientStatusEnum.SKIPPED_NO_EMAIL]: 'ekkert netfang skráð',
  [CompanyEmailRecipientStatusEnum.SKIPPED_QUARANTINED]: 'fyrirtæki í sóttkví',
}

const UNKNOWN_FAILURE_DETAIL = 'óþekkt villa hjá póstþjónustu'

/**
 * The same, for a failed send — classified from the transport's own message.
 *
 * The raw text is an SES or nodemailer string: it names AWS error codes, regions
 * and verified identities, and it is written for whoever reads the log. It stays
 * on the recipient row and in the log; the timeline gets one of these instead,
 * in the same register as `SKIP_DETAIL`.
 *
 * First match wins, so the order is the specificity order. Anything unmatched
 * falls through to `UNKNOWN_FAILURE_DETAIL` rather than being echoed.
 */
const FAILURE_DETAIL_PATTERNS: [RegExp, string][] = [
  [
    /not verified|invalid domain|missing '@'|invalidparameter|not a single valid address|mailbox unavailable|user unknown|does not exist|no such user/i,
    'netfangið var ekki samþykkt',
  ],
  [
    /throttl|maximum sending rate|quota exceeded|too many requests|sending .*(paused|disabled)/i,
    'sendingarkvóti fullnýttur',
  ],
  [
    /too large|message length|size exceeds|payload too large/i,
    'skeytið of stórt',
  ],
  [
    /timeout|etimedout|econnrefused|econnreset|enotfound|socket hang up|network|security token|credential|unable to connect/i,
    'náðist ekki samband við póstþjónustu',
  ],
]

const failureDetail = (error: string | null): string =>
  FAILURE_DETAIL_PATTERNS.find(
    ([pattern]) => error && pattern.test(error),
  )?.[1] ?? UNKNOWN_FAILURE_DETAIL

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
    // Only the extension travels into the key; the rest is server generated. No
    // key is built from `filename`, including the archive one.
    const extension = dto.filename.split('.').pop() ?? ''

    return this.uploadService.createUpload(
      ImportUploadBoundary.MAIL_ATTACHMENT,
      { extension },
    )
  }

  async discardAttachment(
    dto: DiscardCompanyEmailAttachmentDto,
  ): Promise<void> {
    // `cleanupAfter` validates the key against the boundary before deleting, so a
    // client-supplied key cannot be aimed outside `doe-imports/mail-attachment/`.
    // Never throws — a lost cleanup is not something the admin can act on.
    await this.uploadService.cleanupAfter(
      dto.key,
      ImportUploadBoundary.MAIL_ATTACHMENT,
    )
  }

  async preview(dto: SendCompanyEmailDto): Promise<CompanyEmailPreviewDto> {
    // Count cap only, so an over-limit message is refused while composing. The
    // size cap needs the objects read, so it stays in `send`.
    if ((dto.attachments?.length ?? 0) > MAX_ATTACHMENTS) {
      throw new BadRequestException(
        companyEmailMessages.tooManyAttachments(MAX_ATTACHMENTS),
      )
    }

    // Validated here too, so a mistyped copy address is caught while composing.
    normaliseCopyToEmail(dto.copyToEmail)

    const resolved = await this.resolveRecipients(dto)

    const recipients = resolved.filter(
      (r) => r.status === CompanyEmailRecipientStatusEnum.PENDING,
    )
    const skipped = resolved.filter(
      (r) => r.status !== CompanyEmailRecipientStatusEnum.PENDING,
    )

    return {
      // Same sanitising pass as `send`, so the confirmation step renders the
      // bytes that will actually be delivered.
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

    // Refused rather than accepted as an empty batch: a 202 would say the message
    // was on its way when no one is going to receive it.
    if (deliverable.length === 0) {
      throw new BadRequestException(companyEmailMessages.noRecipients())
    }

    const attachments = dto.attachments ?? []
    if (attachments.length > MAX_ATTACHMENTS) {
      throw new BadRequestException(
        companyEmailMessages.tooManyAttachments(MAX_ATTACHMENTS),
      )
    }

    // Before `fetchAttachments`, so a mistyped copy address is refused without
    // spending up to 5MB of S3 reads first.
    const copyToEmail = normaliseCopyToEmail(dto.copyToEmail)

    // Fetched in the request, not in the loop: the size cap is only enforceable by
    // reading the objects, and a cap enforced after the 202 has nothing to reject.
    const buffers = await this.fetchAttachments(attachments)

    // Sanitised before storing; delivery and the timeline read-back both use this
    // stored value, and `preview` runs the same pass.
    const bodyHtml = simpleSanitize(dto.bodyHtml)

    const batch = await this.companyEmailModel.create({
      subject: dto.subject,
      bodyHtml,
      createdByUserId: actorUserId,
      status: CompanyEmailStatusEnum.QUEUED,
      filter: dto.filter
        ? (JSON.parse(JSON.stringify(dto.filter)) as Record<string, unknown>)
        : null,
      // Stored on the batch rather than passed to `deliver`, so a resume knows who
      // the copy is for. `copySentAt` records whether it has already gone.
      copyToEmail,
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

    // After the commit: the loop reads the rows written above through its own
    // queries, so starting earlier would find an empty batch.
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
      copyToEmail: batch.copyToEmail,
      attachments,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    }
  }

  /**
   * Resolve "who should get this" into a classified list.
   *
   * Excluded companies are kept in the result, so the preview can say why the
   * recipient count is smaller than the count of matched companies.
   */
  private async resolveRecipients(
    dto: SendCompanyEmailDto,
  ): Promise<ResolvedRecipient[]> {
    const companyIds = dto.companyIds?.length ? dto.companyIds : undefined
    const filter = dto.filter

    // Exclusive, and one is required. Narrowing on the values rather than on two
    // booleans lets the branch below type-check without an assertion.
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

    // Admin-typed addresses apply only when exactly one company is addressed —
    // there is otherwise no one company they could be the addresses of.
    const addresses =
      companies.length === 1
        ? normaliseRecipientEmails(dto.recipientEmails)
        : []

    if (!addresses.length) {
      return companies.map((company) => classify(company, null))
    }

    const [company] = companies

    // One skipped row for the company, not one per address: quarantine is a fact
    // about the company, and N identical rows would inflate the skipped count.
    if (company.quarantined) {
      return [classify(company, addresses[0])]
    }

    // One message per address, never a shared To line — that would tell each
    // recipient who else the Directorate writes to at their employer.
    return addresses.map((address) => classify(company, address))
  }

  /**
   * Read the staged attachments and enforce the size caps.
   *
   * Fetching through the boundary refuses a client-supplied key that points
   * outside the mail-attachment prefix.
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

        // Matched on the status, not `PayloadTooLargeException`: on S3 the 413
        // arrives as a bare `HttpException`. Kept separate from the unreadable
        // case so the admin looks for a smaller file, not a corrupt one.
        if (
          error instanceof HttpException &&
          error.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
        ) {
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
      // Running total, so several files just under the per-file cap cannot
      // together clear the batch cap.
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
   * Serially: SES enforces a per-second quota, and a fan-out over the register
   * would collect throttling rejections instead.
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
      // Read before claiming it, to tell a first run from a resume. Rows skipped at
      // resolve time need their timeline entry on a first run; emitting again on a
      // resume would double every skip entry.
      const existing = await this.companyEmailModel.findOne({
        where: { id: companyEmailId },
        attributes: ['status', 'copyToEmail', 'copySentAt'],
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

      // The register status is joined once for the batch: `emitOutcome` records the
      // status the event happened under, and a filter without a `status` constraint
      // matches INACTIVE companies too.
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

      // Before the recipients: a batch that dies halfway through the register
      // should still have put the sender's copy in their inbox.
      await this.sendCopy(
        companyEmailId,
        existing?.copyToEmail ?? null,
        existing?.copySentAt ?? null,
        subject,
        bodyHtml,
        mailAttachments,
      )

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

      // Best-effort. The rows are already SENT and the batch COMPLETED, so an
      // archiving fault must not fall through and rewrite it to FAILED.
      await this.archiveAttachments(companyEmailId).catch((error) => {
        this.logger.warn('Could not archive company email attachments', {
          context: LOGGING_CONTEXT,
          companyEmailId,
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      })

      this.logger.info('Finished sending company email', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        recipientCount: rows.length,
      })
    } catch (error) {
      // Only faults that are not one recipient's — the database going away, or the
      // status update failing. A single failed send is handled per row.
      this.logger.error('Company email batch aborted', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        errorMessage: error instanceof Error ? error.message : String(error),
      })

      // Best-effort. If the database is what failed the batch is left in SENDING,
      // with its PENDING rows naming exactly what never went out.
      await this.companyEmailModel
        .update(
          { status: CompanyEmailStatusEnum.FAILED, completedAt: new Date() },
          { where: { id: companyEmailId } },
        )
        .catch(() => undefined)

      // Also attempted here: an aborted batch has still sent to some recipients, so
      // its attachments belong in the audit record. Best-effort, and after the
      // status update, so it cannot replace the error logged above.
      await this.archiveAttachments(companyEmailId).catch(() => undefined)
    }
  }

  /**
   * Put one copy of the message in the sender's inbox, once per batch.
   *
   * Not a BCC on each message — a send at the whole register would deliver ~1700
   * copies to one person. `copySentAt` keeps a resume from sending a second.
   *
   * Best-effort: failing to deliver the copy must not mark a batch that reached
   * its actual recipients as failed. It writes no recipient row and no timeline
   * entry — it belongs to no company.
   */
  private async sendCopy(
    companyEmailId: string,
    copyToEmail: string | null,
    copySentAt: Date | null,
    subject: string,
    bodyHtml: string,
    mailAttachments: { filename: string; content: Buffer; label: string }[],
  ): Promise<void> {
    if (!copyToEmail || copySentAt) return

    try {
      const result = await this.mailService.sendCustomEmail(
        copyToEmail,
        subject,
        bodyHtml,
        mailAttachments,
      )

      if (!result.ok) {
        this.logger.warn('Could not send the company email copy', {
          context: LOGGING_CONTEXT,
          companyEmailId,
          errorMessage: result.error,
        })
        return
      }

      await this.companyEmailModel.update(
        { copySentAt: new Date() },
        { where: { id: companyEmailId } },
      )
    } catch (error) {
      this.logger.warn('Could not send the company email copy', {
        context: LOGGING_CONTEXT,
        companyEmailId,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
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
    // Already terminal: a skip decided when the batch was resolved, or a row a
    // previous partial run finished. On a first run the skip still needs its
    // timeline entry; on a resume it already has one.
    if (row.status !== CompanyEmailRecipientStatusEnum.PENDING) {
      if (isFirstRun) {
        await this.emitOutcome(
          row,
          companyEmailId,
          subject,
          row.status,
          row.error,
          actorUserId,
        )
      }
      return
    }

    let status: CompanyEmailRecipientStatusEnum
    let error: string | null = null

    if (!row.email) {
      // Belt and braces — `classify` already routes an address-less company to
      // SKIPPED_NO_EMAIL.
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
   * Failures are swallowed and logged: losing one audit line must not abort a
   * batch that is still delivering to the rest.
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
        // Joined onto the row in `deliver`; the fallback is unreachable while the
        // foreign key holds.
        row.company?.status ?? CompanyStatusEnum.ACTIVE,
        eventType,
        companyEmailId,
        subject,
        // The reviewer who sent it, so the timeline reads "Jóna sendi tölvupóst"
        // rather than leaving an outbound message with no name against it.
        actorUserId,
        // Never the raw `error` — see `failureDetail`. The transport's own text
        // stays on the recipient row and in the log.
        status === CompanyEmailRecipientStatusEnum.FAILED
          ? failureDetail(error)
          : (SKIP_DETAIL[status] ?? null),
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
   * Move each attachment from the staging prefix to the durable company-files
   * bucket, once the batch has gone out.
   *
   * With `AWS_DOE_COMPANY_FILES_BUCKET` unset nothing is moved *and* nothing is
   * deleted, so the staged object stays as the only copy. Best-effort otherwise:
   * the mail is already delivered.
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
      // Captured before the update: `row.update` mutates `s3Key`, and the archive
      // key sits outside the mail-attachment prefix the boundary check allows.
      const stagedKey = row.s3Key

      try {
        const buffer = await this.uploadService.fetchObject(
          stagedKey,
          ImportUploadBoundary.MAIL_ATTACHMENT,
          MAX_SINGLE_ATTACHMENT_BYTES,
        )

        // One copy per batch, keyed by the staged basename rather than `filename`:
        // two attachments may share a name and collapse onto a single key.
        const stagedName = stagedKey.slice(stagedKey.lastIndexOf('/') + 1)
        const key = `company-emails/${companyEmailId}/${stagedName}`

        // Strip the characters that would break out of the unescaped
        // `Content-Disposition` header. The stored `filename` is left as typed.
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

        // Row first, delete second: a failed delete still leaves the row pointing
        // at a real object.
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
   * is none — tests and callers outside the HTTP pipeline.
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
 * Clean up the addresses the admin typed, and refuse the ones that are not.
 *
 * De-duplicated case-insensitively, keeping the admin's order. Throws where
 * `classify` skips: these are typos in a field the admin is looking at, and a
 * silent skip would never say why an address was dropped.
 */
const normaliseRecipientEmails = (values: string[] | undefined): string[] => {
  const seen = new Set<string>()
  const addresses: string[] = []

  for (const value of values ?? []) {
    const address = value.trim()
    if (!address) continue

    if (!looksLikeOneAddress(address)) {
      throw new BadRequestException(
        companyEmailMessages.invalidRecipientEmail(address),
      )
    }

    const key = address.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    addresses.push(address)
  }

  if (addresses.length > MAX_RECIPIENT_EMAILS) {
    throw new BadRequestException(
      companyEmailMessages.tooManyRecipientEmails(MAX_RECIPIENT_EMAILS),
    )
  }

  return addresses
}

/** The copy address, or null when the admin cleared the field. Same rules. */
const normaliseCopyToEmail = (value: string | null | undefined): string | null => {
  const address = value?.trim()
  if (!address) return null

  if (!looksLikeOneAddress(address)) {
    throw new BadRequestException(
      companyEmailMessages.invalidCopyToEmail(address),
    )
  }

  return address
}

/**
 * Decide, up front, what will happen to one company.
 *
 * Quarantine is checked before the address: a halted company should read as
 * quarantined rather than send the admin off to fill in an address.
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

  // `looksLikeOneAddress`, not an email regex: it rejects separated lists that
  // nodemailer would otherwise split into several deliveries.
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
