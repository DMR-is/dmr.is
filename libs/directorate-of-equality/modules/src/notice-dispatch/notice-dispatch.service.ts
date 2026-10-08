import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyFileService } from '../company-file/company-file.service.interface'
import {
  IDoeMailService,
  ReportMailAttachment,
  ReportMailOutcome,
} from '../mail/doe-mail.service.interface'
import {
  NoticeOutboxChannelEnum,
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../notice-outbox/models/notice-outbox.enums'
import { NoticeOutboxModel } from '../notice-outbox/models/notice-outbox.model'
import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import {
  IReportPdfService,
  ReportPdfResult,
} from '../report-pdf/report-pdf.service.interface'
import {
  INoticeDispatchService,
  NoticeDispatchSummary,
} from './notice-dispatch.service.interface'

const LOGGING_CONTEXT = 'NoticeDispatchService'

/** Rows per run. A run renders up to two PDFs per approval, one at a time. */
export const NOTICE_DISPATCH_BATCH_SIZE = 20

/** Attempts before a row is given up as FAILED. */
export const NOTICE_DISPATCH_MAX_ATTEMPTS = 5

/**
 * Wait between attempts on one row. Five attempts five minutes apart ride out a
 * short SES outage without mailing the company late by more than ~20 minutes.
 */
export const NOTICE_DISPATCH_RETRY_DELAY_MS = 5 * 60 * 1000

type SendResult =
  | { outcome: ReportMailOutcome; channel: NoticeOutboxChannelEnum }
  | { outcome: 'SKIPPED' }
  | { outcome: 'GONE'; reason: string }

/**
 * Sends what the notice outbox says a company is owed.
 *
 * Phase 1 of the OneSystems work: email only, exactly the notices the workflow
 * sent before (approved, denied), and nothing for a submission, which never had
 * an email. Mailbox delivery through One replaces the email per kind later.
 *
 * ⚠️ **Every outbox write is `transaction: null`.** The dispatcher runs inside
 * the advisory-lock transaction (`runWithDistributedLock`), which every query
 * joins through CLS. A row marked DONE inside it would be rolled back by any
 * later failure in the run, after the mail had already gone, and the next run
 * would mail the company again. Writing outside it makes each row's outcome
 * stand the moment it is known.
 *
 * ⚠️ **A process that dies between the send and the DONE write mails twice.**
 * Email has no idempotency key, so the next run cannot tell the send happened.
 * That window is milliseconds; the gap it replaces (a notice lost outright when
 * the process died after commit) was not.
 */
@Injectable()
export class NoticeDispatchService implements INoticeDispatchService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IDoeMailService) private readonly mailService: IDoeMailService,
    @Inject(IReportPdfService)
    private readonly reportPdfService: IReportPdfService,
    @Inject(ICompanyFileService)
    private readonly companyFileService: ICompanyFileService,
    @InjectModel(NoticeOutboxModel)
    private readonly noticeOutboxModel: typeof NoticeOutboxModel,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
  ) {}

  async dispatchPending(): Promise<NoticeDispatchSummary> {
    const retryBefore = new Date(Date.now() - NOTICE_DISPATCH_RETRY_DELAY_MS)

    const rows = await this.noticeOutboxModel.findAll({
      where: {
        status: NoticeOutboxStatusEnum.PENDING,
        [Op.or]: [
          { lastAttemptAt: null },
          { lastAttemptAt: { [Op.lt]: retryBefore } },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit: NOTICE_DISPATCH_BATCH_SIZE,
    })

    let settled = 0

    // Sequential on purpose: each approval renders PDFs in a fresh Chromium,
    // and the pool (`max: 5`) is shared with the lock's own connection.
    for (const row of rows) {
      if (await this.dispatchRow(row)) {
        settled += 1
      }
    }

    return { picked: rows.length, settled }
  }

  /** Returns whether the row left PENDING. Never throws. */
  private async dispatchRow(row: NoticeOutboxModel): Promise<boolean> {
    let result: SendResult

    try {
      result = await this.send(row)
    } catch (error) {
      // Anything `send` did not turn into an outcome itself: a failed load, a
      // throw from a collaborator. Retryable, like a failed send.
      this.logger.error(
        `Notice ${row.kind} for report ${row.reportId} failed`,
        {
          context: LOGGING_CONTEXT,
          noticeId: row.id,
          message: error instanceof Error ? error.message : String(error),
        },
      )
      result = {
        outcome: ReportMailOutcome.FAILED,
        channel: NoticeOutboxChannelEnum.EMAIL,
      }
    }

    try {
      return await this.record(row, result)
    } catch (error) {
      // The send may well have happened. The row stays PENDING and the next
      // run sends again: see the class note on the double-send window.
      this.logger.error(
        `Could not record the outcome of notice ${row.id} — it will be sent again`,
        {
          context: LOGGING_CONTEXT,
          noticeId: row.id,
          message: error instanceof Error ? error.message : String(error),
        },
      )
      return false
    }
  }

  private async send(row: NoticeOutboxModel): Promise<SendResult> {
    switch (row.kind) {
      case NoticeOutboxKindEnum.REPORT_SUBMITTED:
        // No email for a submission has ever existed. The receipt goes out
        // only through the mailbox, which is not wired yet.
        return { outcome: 'SKIPPED' }
      case NoticeOutboxKindEnum.REPORT_APPROVED:
        return this.sendApproved(row.reportId)
      case NoticeOutboxKindEnum.REPORT_DENIED:
        return this.sendDenied(row.reportId)
      default:
        return { outcome: 'GONE', reason: `unknown kind ${row.kind}` }
    }
  }

  private async record(
    row: NoticeOutboxModel,
    result: SendResult,
  ): Promise<boolean> {
    const now = new Date()

    if (result.outcome === 'SKIPPED') {
      await this.settle(row, NoticeOutboxStatusEnum.SKIPPED, now, {
        channel: null,
        lastError: null,
      })
      return true
    }

    if (result.outcome === 'GONE') {
      this.logger.error(
        `Gave up on notice ${row.kind} for report ${row.reportId}: ${result.reason}`,
        { context: LOGGING_CONTEXT, noticeId: row.id },
      )
      await this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
        channel: null,
        lastError: result.reason,
      })
      return true
    }

    const attempts = row.attempts + 1

    switch (result.outcome) {
      case ReportMailOutcome.SENT:
        await this.settle(row, NoticeOutboxStatusEnum.DONE, now, {
          channel: result.channel,
          lastError: null,
          attempts,
        })
        return true

      case ReportMailOutcome.NO_RECIPIENT:
        // Logged at error, not left to the mail service's warn: a decision
        // nobody was told about must reach error-level alerting.
        this.logger.error(
          `Notice ${row.kind} for report ${row.reportId} has no usable contact or admin email — giving up`,
          { context: LOGGING_CONTEXT, noticeId: row.id },
        )
        await this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
          channel: null,
          lastError: 'no usable contact or admin email',
          attempts,
        })
        return true

      case ReportMailOutcome.FAILED:
        if (attempts >= NOTICE_DISPATCH_MAX_ATTEMPTS) {
          this.logger.error(
            `Notice ${row.kind} for report ${row.reportId} failed ${attempts} times — giving up`,
            { context: LOGGING_CONTEXT, noticeId: row.id },
          )
          await this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
            channel: null,
            lastError: 'send failed',
            attempts,
          })
          return true
        }

        await this.noticeOutboxModel.update(
          { attempts, lastAttemptAt: now, lastError: 'send failed' },
          { where: { id: row.id }, transaction: null },
        )
        return false
    }
  }

  private async settle(
    row: NoticeOutboxModel,
    status: NoticeOutboxStatusEnum,
    now: Date,
    fields: {
      channel: NoticeOutboxChannelEnum | null
      lastError: string | null
      attempts?: number
    },
  ): Promise<void> {
    await this.noticeOutboxModel.update(
      {
        status,
        channel: fields.channel,
        lastError: fields.lastError,
        attempts: fields.attempts ?? row.attempts,
        lastAttemptAt: fields.attempts === undefined ? row.lastAttemptAt : now,
        processedAt: now,
      },
      // `status: PENDING` too: a row some other path already settled is left
      // as it is rather than overwritten.
      {
        where: { id: row.id, status: NoticeOutboxStatusEnum.PENDING },
        transaction: null,
      },
    )
  }

  /**
   * Tells the company its report was approved, with the approved document(s)
   * attached, and archives the documents once the mail went out.
   *
   * A render failure costs an attachment, never the notice: the notice is the
   * part that cannot be reconstructed later, and the documents can be
   * downloaded from the report screen.
   */
  private async sendApproved(reportId: string): Promise<SendResult> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: [
        'id',
        'type',
        'validUntil',
        'contactEmail',
        'companyAdminEmail',
        'companyNationalId',
        // Dates the S3 key — see `archiveApprovalDocuments`.
        'approvedAt',
      ],
    })

    if (!report) {
      return { outcome: 'GONE', reason: 'report not found' }
    }

    const attachments = await this.buildApprovalAttachments(
      report.type,
      reportId,
    )

    const outcome = await this.mailService.sendReportApproved(
      report,
      attachments,
    )

    /*
     * ⚠️ **After the send, and only when it landed.** Archiving is secondary:
     * the company having its documents is the point, keeping our own copy is the
     * record. Uploading first would let an unset or misconfigured bucket stop
     * the notification. And the archive is the Directorate's copy of what the
     * company received, so writing it after a failed send puts a false yes
     * where someone will later look for proof of delivery. `archive` never
     * throws.
     */
    if (outcome === ReportMailOutcome.SENT) {
      await this.archiveApprovalDocuments(report, attachments)
    }

    return { outcome, channel: NoticeOutboxChannelEnum.EMAIL }
  }

  /**
   * Keeps the Directorate's own copy of what was sent, under the company's
   * prefix in the company-files bucket.
   *
   * The key is `company-files/{companyNationalId}/{YYYY-MM-DD}-{filename}` and
   * is fully reconstructible from the report — national id, `approvedAt` and the
   * deterministic file names — which is why nothing is written to the database
   * yet. A `s3_key` column can follow if retrieval ever needs to not recompute
   * it.
   *
   * ⚠️ Skipped when the report carries no `companyNationalId` (the column is
   * nullable). The prefix IS the retrieval path, so a document filed without one
   * is a document nobody will find; a warn is more useful than an unreachable
   * object, and the company still received it by mail.
   */
  private async archiveApprovalDocuments(
    report: Pick<ReportModel, 'id' | 'companyNationalId' | 'approvedAt'>,
    attachments: ReportMailAttachment[],
  ): Promise<void> {
    if (attachments.length === 0) {
      // Every render this report kind asks for failed. The notice went out
      // without them, so there is nothing to keep a copy of.
      return
    }

    const companyNationalId = report.companyNationalId

    if (!companyNationalId) {
      this.logger.warn(
        `Not archiving approval documents for report ${report.id} — no companyNationalId to file them under`,
        { context: LOGGING_CONTEXT },
      )
      return
    }

    /*
     * ⚠️ `approvedAt`, not `new Date()`. The key is justified as "reconstructible
     * from the report", and the only date on the report is `approvedAt`. The
     * dispatcher runs up to minutes after the approval, and renders take
     * seconds on top, so a wall-clock stamp files an approval made near midnight
     * under the following day.
     */
    const issuedAt = report.approvedAt ?? new Date()

    await this.companyFileService.archive(
      attachments.map((attachment) => ({
        companyNationalId,
        filename: attachment.filename,
        content: attachment.content,
        issuedAt,
      })),
    )
  }

  /**
   * The documents an approval mails, by report kind.
   *
   * An equality approval carries the report. A salary approval carries the
   * report and the úrbótaáætlun as two documents, because the second is what the
   * company committed to rather than what the Directorate assessed, and filing
   * them together would bury it.
   *
   * Each render is guarded on its own, so one failing costs only its own
   * attachment. Empty means every render failed: the notice still goes, and
   * `buildReportApprovedHtml` omits the "Skjalið er í viðhengi" line.
   */
  private async buildApprovalAttachments(
    type: ReportTypeEnum,
    reportId: string,
  ): Promise<ReportMailAttachment[]> {
    let reportAttachment: ReportMailAttachment | null = null

    try {
      const { pdf, fileName } =
        await this.reportPdfService.generateReportPdf(reportId)

      reportAttachment = {
        filename: fileName,
        content: pdf,
        label:
          type === ReportTypeEnum.SALARY
            ? 'jafnlaunaúttekt'
            : 'jafnréttisáætlun',
      }
    } catch (error) {
      this.logger.error(
        `Failed to render the report PDF for approved report ${reportId} — sending the approval notice without it`,
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }

    if (type !== ReportTypeEnum.SALARY) {
      return reportAttachment ? [reportAttachment] : []
    }

    // `null` means "no plan to state" (a compliant company). A throw means the
    // plan exists and could not be produced, which is logged at error.
    let plan: ReportPdfResult | null = null

    try {
      plan = await this.reportPdfService.generateImprovementPlanPdf(reportId)
    } catch (error) {
      this.logger.error(
        `Failed to render the úrbótaáætlun for report ${reportId} — mailing the report alone`,
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }

    const planAttachment: ReportMailAttachment | null = plan
      ? { filename: plan.fileName, content: plan.pdf, label: 'úrbótaáætlun' }
      : null

    return [reportAttachment, planAttachment].filter(
      (attachment): attachment is ReportMailAttachment => attachment !== null,
    )
  }

  /**
   * Tells the company its report was denied, with the reviewer's reason as the
   * body. The reason is read from the denial's STATUS_CHANGED event rather than
   * copied into the outbox, so the outbox holds ids only.
   */
  private async sendDenied(reportId: string): Promise<SendResult> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['id', 'type', 'contactEmail', 'companyAdminEmail'],
    })

    if (!report) {
      return { outcome: 'GONE', reason: 'report not found' }
    }

    const deniedEvent = await this.reportEventModel.findOne({
      where: {
        reportId,
        eventType: ReportEventTypeEnum.STATUS_CHANGED,
        toStatus: ReportStatusEnum.DENIED,
      },
      attributes: ['reason'],
      order: [['createdAt', 'DESC']],
    })

    // `deny` refuses a blank reason, so a missing one means the event is gone,
    // not that the reviewer gave none. Sending a denial with no reason would
    // tell the company nothing it can act on.
    if (!deniedEvent?.reason) {
      return { outcome: 'GONE', reason: 'denial reason not found' }
    }

    const outcome = await this.mailService.sendReportDenied(
      report,
      deniedEvent.reason,
    )

    return { outcome, channel: NoticeOutboxChannelEnum.EMAIL }
  }
}
