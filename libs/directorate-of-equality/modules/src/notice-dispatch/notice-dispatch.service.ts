import { literal, Op, Transaction, WhereOptions } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ICompanyFileService } from '../company-file/company-file.service.interface'
import {
  IDoeMailService,
  ReportMailAttachment,
  ReportMailOutcome,
} from '../mail/doe-mail.service.interface'
import { buildReportApprovedSubject } from '../mail/templates/report-approved.template'
import { buildMailboxDeliveryIdempotencyKey } from '../mailbox-delivery/mailbox-delivery.idempotency-key'
import {
  DeliverToMailboxResult,
  IMailboxDeliveryService,
  isMailboxDeliveryEnabled,
} from '../mailbox-delivery/mailbox-delivery.service.interface'
import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
} from '../mailbox-delivery/models/mailbox-delivery.enums'
import {
  buildApprovedLetter,
  buildDeniedLetter,
  buildSubmittedLetter,
  noticeLetterStyles,
} from '../notice-letter/notice-letter.template'
import {
  NoticeOutboxChannelEnum,
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../notice-outbox/models/notice-outbox.enums'
import { NoticeOutboxModel } from '../notice-outbox/models/notice-outbox.model'
import { IPdfRenderService } from '../pdf-render/pdf-render.service.interface'
import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { mergePdfs } from '../report-pdf/lib/merge'
import {
  IReportPdfService,
  ReportPdfResult,
} from '../report-pdf/report-pdf.service.interface'
import {
  INoticeDispatchService,
  NoticeDispatchSummary,
  OverdueNotice,
} from './notice-dispatch.service.interface'

const LOGGING_CONTEXT = 'NoticeDispatchService'

/** Rows per run. A run renders up to two PDFs per approval, one at a time. */
export const NOTICE_DISPATCH_BATCH_SIZE = 20

/** Attempts before a row is given up as FAILED. */
export const NOTICE_DISPATCH_MAX_ATTEMPTS = 5

/**
 * Wait between attempts on one row. Five attempts five minutes apart ride out a
 * short SES outage without mailing the company late by more than ~20 minutes.
 *
 * A longer outage leaves its notices FAILED. They are re-driven by hand: see
 * "Re-driving a FAILED row" under `notice_outbox` in doe-api's `db/README.md`.
 */
export const NOTICE_DISPATCH_RETRY_DELAY_MS = 5 * 60 * 1000

/**
 * Whether an approval is the one that completes the company's reporting
 * obligations, which is when Jafnréttisstofa asks it to answer the service
 * survey.
 *
 * - An equality report completes them when no salary report is owed, that is
 *   when `company.salary_report_required` is off.
 * - A salary report completes them when one is owed: it cannot be submitted
 *   before the equality obligation is met, and its approval requires every
 *   outlier explained, so any úrbótaáætlun is in by then.
 *
 * A salary report filed when none is owed gets no survey. Nothing stops such a
 * filing, and its company was already asked with its equality approval.
 *
 * The obligation is `salary_report_required`, not the size bucket, because an
 * admin can pin it either way (`salary_report_required_override`): a company
 * under 50 forced on owes a salary report after its equality report, and one
 * at 50+ forced off owes only the equality report. The flag is not snapshotted
 * on `company_report` (admin state, not filing data; see doe-api's
 * `db/README.md`), so it is read off `company` when the notice is sent. Null,
 * a filing company not found, gets no survey on an equality approval.
 */
export const offersServiceSurvey = (
  type: ReportTypeEnum,
  salaryReportRequired: boolean | null,
): boolean =>
  type === ReportTypeEnum.SALARY
    ? salaryReportRequired === true
    : type === ReportTypeEnum.EQUALITY && salaryReportRequired === false

/**
 * Loads the filing company's `salary_report_required` alongside its snapshot,
 * for `offersServiceSurvey`.
 */
const FILING_COMPANY_OBLIGATION = {
  model: CompanyModel,
  as: 'company',
  attributes: ['id', 'salaryReportRequired'],
}

/**
 * No new row is started once a run has taken this long. The run holds the
 * advisory lock's transaction, and a pool connection with it, until it ends,
 * and one mailbox row can take minutes when One is slow (two calls at up to
 * 2 x (30 s + 120 s) each, plus renders). Rows left over are picked by the
 * next run, so the lock is held for about this long plus one row at worst.
 */
export const NOTICE_DISPATCH_TIME_BUDGET_MS = 5 * 60 * 1000

/**
 * A PENDING row older than this is not progressing: five attempts five
 * minutes apart settle a row within about half an hour. It is named in the
 * daily alert (`findOverdueNotices`) unless it waits by design.
 */
export const NOTICE_OVERDUE_AFTER_MS = 60 * 60 * 1000

/**
 * The report statuses a notice of each kind is still owed in, checked when the
 * row is sent. A row can wait a long time (a quarantine, the flag off, a held
 * delivery), and what it would say may no longer be true by then:
 *
 * - A receipt is owed only while the report awaits a decision. Once it is
 *   decided, superseded or withdrawn, "we have received it" would arrive after
 *   the decision, or about a report nobody is assessing.
 * - A decision is owed only while the report still has it. An approval whose
 *   report has since been superseded, or a denial the report has moved on
 *   from, must not go out on release.
 *
 * A row not owed is settled SKIPPED, naming the status, and never sent.
 */
const OWED_WHILE: Record<NoticeOutboxKindEnum, readonly ReportStatusEnum[]> = {
  [NoticeOutboxKindEnum.REPORT_SUBMITTED]: [
    ReportStatusEnum.SUBMITTED,
    ReportStatusEnum.POSTPONED,
    ReportStatusEnum.IN_REVIEW,
  ],
  [NoticeOutboxKindEnum.REPORT_APPROVED]: [ReportStatusEnum.APPROVED],
  [NoticeOutboxKindEnum.REPORT_DENIED]: [ReportStatusEnum.DENIED],
}

/**
 * A row whose filing company is quarantined is not picked at all: quarantine
 * halts every outbound touchpoint (`CompanyService.updateQuarantine`), and the
 * notice waits, PENDING and untouched, until it is lifted. Not picking it, as
 * opposed to picking and passing over it, keeps a long quarantine from taking
 * batch slots every run.
 *
 * Raw SQL against the alias Sequelize gives `notice_outbox` in this query
 * (`"NoticeOutboxModel"`); every name in it is a constant.
 */
const FILING_COMPANY_NOT_QUARANTINED = literal(`NOT EXISTS (
  SELECT 1
    FROM company_report cr
    JOIN company c ON c.id = cr.company_id
   WHERE cr.report_id = "NoticeOutboxModel"."report_id"
     AND cr.parent_company_id IS NULL
     AND c.quarantined
)`)

/** The mailbox kind of each notice, by report type: each has its own case template. */
const MAILBOX_KINDS: Record<
  NoticeOutboxKindEnum,
  Record<ReportTypeEnum, MailboxDeliveryKindEnum>
> = {
  [NoticeOutboxKindEnum.REPORT_SUBMITTED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
    [ReportTypeEnum.EQUALITY]:
      MailboxDeliveryKindEnum.EQUALITY_REPORT_SUBMITTED,
  },
  [NoticeOutboxKindEnum.REPORT_APPROVED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_APPROVED,
    [ReportTypeEnum.EQUALITY]: MailboxDeliveryKindEnum.EQUALITY_REPORT_APPROVED,
  },
  [NoticeOutboxKindEnum.REPORT_DENIED]: {
    [ReportTypeEnum.SALARY]: MailboxDeliveryKindEnum.SALARY_REPORT_DENIED,
    [ReportTypeEnum.EQUALITY]: MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
  },
}

/** A notice ready for the mailbox. The PDF is rendered only if One needs it. */
type MailboxNotice = {
  subject: string
  pdf: () => Promise<Buffer>
  /** Runs once the row is recorded DONE. Never throws. */
  afterDone?: () => Promise<void>
}

type Gone = { outcome: 'GONE'; reason: string }

/**
 * Not sent and not an attempt: the row stays PENDING for a later run.
 * `alert` logs it at warn, for a hold that waits on a person rather than on
 * time; such a row is also named in the daily alert once overdue.
 */
type Held = { outcome: 'HELD'; reason: string; alert?: boolean }

/** No longer owed (`OWED_WHILE`): settled SKIPPED, never sent. */
type NotOwed = { outcome: 'NOT_OWED'; reason: string }

type SendResult =
  | {
      outcome: ReportMailOutcome.SENT
      channel: NoticeOutboxChannelEnum
      /** Runs once the row is recorded DONE. Never throws. */
      afterDone?: () => Promise<void>
    }
  | {
      outcome: ReportMailOutcome.NO_RECIPIENT | ReportMailOutcome.FAILED
      channel: NoticeOutboxChannelEnum
    }
  | Gone
  | Held
  | NotOwed

/**
 * Sends what the notice outbox says a company is owed.
 *
 * With `ONESYSTEMS_ENABLED` on, every notice goes to the company's island.is
 * mailbox through One as a PDF letter, and no email is sent: the receipt, the
 * approval (letter, report and úrbótaáætlun merged into one PDF) and the
 * denial. With it off, the approval and denial are emailed as before, and the
 * receipt, which never had an email, waits PENDING for the flag: it is not
 * picked while the flag is off, so turning the flag off during a One incident
 * holds the receipts rather than dropping them.
 *
 * ⚠️ **An approval or denial already started through One is not emailed when
 * the flag goes off.** Its `mailbox_delivery` row (same key) is checked first:
 * a send One confirmed records the row DONE by mailbox, an UNCERTAIN one gives
 * the row up for a person, and a document One already holds waits for the
 * flag to come back rather than leave it orphaned and mail the company too.
 *
 * Rows of a quarantined filing company are not picked (see
 * `FILING_COMPANY_NOT_QUARANTINED`).
 *
 * A row is sent only while the report still has a status its notice is owed
 * in (`OWED_WHILE`), checked when it is sent: a receipt for a report already
 * decided, or a decision the report has moved on from, is settled SKIPPED.
 * This is what keeps the receipts held with the flag off from arriving after
 * the decision once it goes on.
 *
 * With the flag on, a mailbox kind with no case template (`UNCONFIGURED`)
 * holds its rows without counting an attempt, so switching the flag on before
 * the templates are confirmed loses no notice. A held row goes to the back of
 * the pick, so held rows cannot starve the ones that can go. The daily alert
 * names the kind, and every row overdue for another reason
 * (`findOverdueNotices`).
 *
 * A mailbox delivery is idempotent by its key (kind, company, report), so a
 * retried row resumes the same delivery. One left UNCERTAIN is never retried:
 * the row is given up as FAILED, naming the delivery a person must check.
 *
 * ⚠️ **Every outbox write is `transaction: null`.** The dispatcher runs inside
 * the advisory-lock transaction (`runWithDistributedLock`), which every query
 * joins through CLS. A row marked DONE inside it would be rolled back by any
 * later failure in the run, after the mail had already gone, and the next run
 * would mail the company again. Writing outside it makes each row's outcome
 * stand the moment it is known.
 *
 * ⚠️ **Every row runs in a savepoint on the lock's transaction, and so does
 * every PDF render.** Reads still join the lock's transaction, and one failed
 * query aborts a Postgres transaction for everything after it. Without the
 * savepoints a DB error in one render would fail the other render too (the
 * notice going out with no documents), then every later row's first read, and
 * the lock's COMMIT would become a silent ROLLBACK.
 *
 * ⚠️ **A process that dies between the send and the DONE write mails twice,
 * by email.** Email has no idempotency key, so the next run cannot tell the
 * send happened. A mailbox send does not repeat: the next run resumes the same
 * delivery by its key and gets `alreadySent`.
 * The DONE write follows the send directly — archiving the approval documents
 * to S3 waits until after it — so the window is one UPDATE on a fresh pool
 * connection: under contention that includes the wait for one (`max: 5`, up to
 * 30 s), and an acquire timeout leaves the row PENDING to be sent again. The gap
 * it replaces (a notice lost outright when the process died after commit) was
 * wider.
 *
 * ⚠️ **A process that dies between the DONE write and the archive keeps no
 * copy.** The company has the documents and the row says DONE, but nothing in
 * S3 or the database records the missing archive. That is the price of never
 * mailing twice; a missing archive is not evidence the notice failed. A
 * mailbox approval whose PDF was not rendered in the run that recorded it
 * (a resume past CreateDocument, or `alreadySent`) is not such a gap: its
 * documents are rendered again for the archive.
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
    @Inject(IMailboxDeliveryService)
    private readonly mailboxDeliveryService: IMailboxDeliveryService,
    @Inject(IPdfRenderService)
    private readonly pdfRenderService: IPdfRenderService,
    @InjectModel(NoticeOutboxModel)
    private readonly noticeOutboxModel: typeof NoticeOutboxModel,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async dispatchPending(
    lockTransaction: Transaction,
  ): Promise<NoticeDispatchSummary> {
    const startedAt = Date.now()
    const retryBefore = new Date(startedAt - NOTICE_DISPATCH_RETRY_DELAY_MS)

    const where: WhereOptions<NoticeOutboxModel> = {
      status: NoticeOutboxStatusEnum.PENDING,
      [Op.or]: [
        { lastAttemptAt: null },
        { lastAttemptAt: { [Op.lt]: retryBefore } },
      ],
      ...this.notWaitingByDesign(),
    }

    // Least recently looked at first, never-tried rows ahead of all. A held
    // row (unconfigured kind, a document One holds) is re-stamped on every
    // look, so it goes to the back of the queue: however many are held, they
    // cannot fill every batch and starve rows that can go.
    const rows = await this.noticeOutboxModel.findAll({
      where,
      order: [
        ['lastAttemptAt', 'ASC NULLS FIRST'],
        ['createdAt', 'ASC'],
      ],
      limit: NOTICE_DISPATCH_BATCH_SIZE,
    })

    let picked = 0
    let settled = 0

    // Sequential on purpose: each approval renders PDFs in a fresh Chromium,
    // and the pool (`max: 5`) is shared with the lock's own connection.
    for (const row of rows) {
      if (Date.now() - startedAt >= NOTICE_DISPATCH_TIME_BUDGET_MS) {
        this.logger.warn(
          `Notice dispatch ran past its time budget; leaving ${rows.length - picked} rows for the next run`,
          { context: LOGGING_CONTEXT, left: rows.length - picked },
        )
        break
      }

      picked += 1
      if (await this.dispatchRow(row, lockTransaction)) {
        settled += 1
      }
    }

    return { picked, settled }
  }

  async findOverdueNotices(
    limit: number,
  ): Promise<{ total: number; notices: OverdueNotice[] }> {
    const where: WhereOptions<NoticeOutboxModel> = {
      status: NoticeOutboxStatusEnum.PENDING,
      createdAt: { [Op.lt]: new Date(Date.now() - NOTICE_OVERDUE_AFTER_MS) },
      ...this.notWaitingByDesign(),
    }

    const total = await this.noticeOutboxModel.count({
      where,
      transaction: null,
    })
    if (total === 0) {
      return { total, notices: [] }
    }

    const rows = await this.noticeOutboxModel.findAll({
      where,
      attributes: [
        'id',
        'kind',
        'reportId',
        'attempts',
        'lastError',
        'createdAt',
      ],
      order: [['createdAt', 'ASC']],
      limit,
      transaction: null,
    })

    return {
      total,
      notices: rows.map((row) => ({
        noticeId: row.id,
        kind: row.kind,
        reportId: row.reportId,
        attempts: row.attempts,
        lastError: row.lastError,
        createdAt: row.createdAt,
      })),
    }
  }

  /**
   * The rows that wait by design, left out of the pick and the overdue alert:
   * a quarantined filing company's, and, with the flag off, receipts. A
   * receipt only ever goes to the mailbox, so with the flag off it waits,
   * unpicked, and cannot take a batch slot from a notice that can go.
   */
  private notWaitingByDesign(): WhereOptions<NoticeOutboxModel> {
    return {
      [Op.and]: [FILING_COMPANY_NOT_QUARANTINED],
      ...(isMailboxDeliveryEnabled()
        ? {}
        : { kind: { [Op.ne]: NoticeOutboxKindEnum.REPORT_SUBMITTED } }),
    }
  }

  /** Returns whether the row left PENDING. Never throws. */
  private async dispatchRow(
    row: NoticeOutboxModel,
    lockTransaction: Transaction,
  ): Promise<boolean> {
    let result: SendResult

    try {
      // `send` opens its render savepoints on the lock's transaction, not on
      // the row's: Sequelize numbers a savepoint by its direct parent, so a
      // render savepoint on the row's would reuse an earlier row's name.
      result = await this.inSavepoint(lockTransaction, () =>
        this.send(row, lockTransaction),
      )
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

    let settled: boolean

    try {
      settled = await this.record(row, result)
    } catch (error) {
      // The send may well have happened. The row stays PENDING and the next
      // run tries again: an email is sent again (see the class note on the
      // double-send window), a mailbox delivery resumes by its key.
      this.logger.error(
        `Could not record the outcome of notice ${row.id} — the next run tries it again`,
        {
          context: LOGGING_CONTEXT,
          noticeId: row.id,
          message: error instanceof Error ? error.message : String(error),
        },
      )
      return false
    }

    // Not when `settled` is false: some other path settled the row first, so
    // the follow-up is that path's, and archiving here could file a second copy.
    if (
      settled &&
      result.outcome === ReportMailOutcome.SENT &&
      result.afterDone
    ) {
      try {
        await result.afterDone()
      } catch (error) {
        // `afterDone` is not meant to throw. If it does, the row is already
        // DONE, so log it rather than let it read as a failed send.
        this.logger.error(`Follow-up to notice ${row.id} failed`, {
          context: LOGGING_CONTEXT,
          noticeId: row.id,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return settled
  }

  /**
   * Runs `work` in a savepoint on `parent`. A DB error inside rolls back to the
   * savepoint and leaves `parent` usable. Always pass the lock's transaction:
   * savepoint names are numbered per parent, so nesting would repeat them.
   * `sequelize.transaction(cb)` without `{ transaction: parent }` would open a
   * second top-level transaction on its own connection instead of nesting.
   */
  private inSavepoint<T>(
    parent: Transaction,
    work: (savepoint: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.sequelize.transaction({ transaction: parent }, work)
  }

  private async send(
    row: NoticeOutboxModel,
    lockTransaction: Transaction,
  ): Promise<SendResult> {
    if (isMailboxDeliveryEnabled()) {
      return this.sendToMailbox(row, lockTransaction)
    }

    switch (row.kind) {
      case NoticeOutboxKindEnum.REPORT_SUBMITTED:
        // No email for a submission has ever existed. The receipt goes out
        // only through the mailbox, so it waits for the flag. Not picked while
        // the flag is off; this covers the flag going off mid-run.
        return { outcome: 'HELD', reason: 'mailbox delivery is off' }
      case NoticeOutboxKindEnum.REPORT_APPROVED:
        return (
          (await this.startedInMailbox(row, lockTransaction)) ??
          this.sendApproved(row.reportId, lockTransaction)
        )
      case NoticeOutboxKindEnum.REPORT_DENIED:
        return (
          (await this.startedInMailbox(row, lockTransaction)) ??
          this.sendDenied(row.reportId)
        )
      default:
        return { outcome: 'GONE', reason: `unknown kind ${row.kind}` }
    }
  }

  /**
   * With the flag off: what to do instead of emailing, when this notice's
   * mailbox delivery (same key) already got somewhere in One. Null when it did
   * not, or there is none, and the email can go.
   *
   * - One confirmed the send: the company has it. The row is DONE by mailbox,
   *   and an approval's documents are archived as after any mailbox send.
   * - UNCERTAIN, or interrupted mid-call (`interrupted`, which the next claim
   *   would mark UNCERTAIN): One may have sent it. Given up for a person, as
   *   with the flag on, rather than emailed on top.
   * - A worker holds a live lease on it: held until that call finishes, and
   *   the next run reads what it left.
   * - One holds the document but has not sent it: held until the flag is back
   *   on and the delivery can finish. Emailing would leave the document in One
   *   for the next run with the flag on to send as well. Held with `alert`, and
   *   named in the daily alert once overdue: if the flag stays off, a person
   *   decides.
   * - Nothing past CreateCase (the case is shared and finds-or-creates): the
   *   email goes.
   */
  private async startedInMailbox(
    row: NoticeOutboxModel,
    lockTransaction: Transaction,
  ): Promise<SendResult | null> {
    const report = await this.reportModel.findOne({
      where: { id: row.reportId },
      attributes: ['id', 'type', 'companyNationalId', 'approvedAt'],
    })
    const company = report
      ? await this.companyReportModel.findOne({
          where: { reportId: row.reportId, parentCompanyId: null },
          attributes: ['companyId'],
        })
      : null

    // The email path gives a missing report its own outcome.
    if (!report || !company) {
      return null
    }

    const kind = MAILBOX_KINDS[row.kind][report.type]
    const delivery = await this.mailboxDeliveryService.findDelivery(
      buildMailboxDeliveryIdempotencyKey({
        kind,
        companyId: company.companyId,
        discriminator: report.id,
      }),
    )

    if (!delivery) {
      return null
    }

    if (delivery.status === MailboxDeliveryStatusEnum.UNCERTAIN) {
      return {
        outcome: 'GONE',
        reason: `mailbox delivery ${delivery.deliveryId} is UNCERTAIN; check One before repeating anything`,
      }
    }

    if (delivery.interrupted) {
      return {
        outcome: 'GONE',
        reason: `mailbox delivery ${delivery.deliveryId} was interrupted mid-call; check One before repeating anything`,
      }
    }

    if (delivery.sent || delivery.status === MailboxDeliveryStatusEnum.SENT) {
      return {
        outcome: ReportMailOutcome.SENT,
        channel: NoticeOutboxChannelEnum.MAILBOX,
        afterDone:
          row.kind === NoticeOutboxKindEnum.REPORT_APPROVED
            ? () => this.archiveRenderedAgain(report, lockTransaction)
            : undefined,
      }
    }

    if (delivery.inProgress) {
      return {
        outcome: 'HELD',
        reason: `mailbox delivery ${delivery.deliveryId} is in progress`,
      }
    }

    if (delivery.documentFiled) {
      return {
        outcome: 'HELD',
        reason: `mailbox delivery ${delivery.deliveryId} has a document in One that is not sent; waiting for ONESYSTEMS_ENABLED`,
        alert: true,
      }
    }

    return null
  }

  /**
   * Settles a row no longer owed (`OWED_WHILE`), unless its mailbox delivery
   * already got somewhere in One. A delivery One sent is finished as usual, so
   * the row records what the company has. A delivery One may hold a document
   * for, or may have sent, is given up for a person: not sending a stale
   * notice, and not losing track of what One holds.
   */
  private async notOwed(
    row: NoticeOutboxModel,
    report: Pick<ReportModel, 'id' | 'type' | 'status'>,
    companyId: string,
  ): Promise<NotOwed | Gone | Held | null> {
    const stale = notOwedByStatus(row.kind, report)
    if (!stale) {
      return null
    }

    const delivery = await this.mailboxDeliveryService.findDelivery(
      buildMailboxDeliveryIdempotencyKey({
        kind: MAILBOX_KINDS[row.kind][report.type],
        companyId,
        discriminator: report.id,
      }),
    )

    if (!delivery) {
      return stale
    }
    if (delivery.sent || delivery.status === MailboxDeliveryStatusEnum.SENT) {
      return null
    }
    if (delivery.inProgress) {
      // Another worker holds a live lease and may be calling One right now.
      // Look again once it has finished, as `startedInMailbox` does.
      return {
        outcome: 'HELD',
        reason: `${stale.reason}, but mailbox delivery ${delivery.deliveryId} is in progress`,
      }
    }
    if (
      delivery.documentFiled ||
      delivery.interrupted ||
      delivery.status === MailboxDeliveryStatusEnum.UNCERTAIN
    ) {
      return {
        outcome: 'GONE',
        reason: `${stale.reason}, but mailbox delivery ${delivery.deliveryId} may have reached One; check One`,
      }
    }
    return stale
  }

  /**
   * Delivers the notice to the filing company's mailbox. A group report's
   * subsidiaries get nothing: the notice goes to the company that filed.
   */
  private async sendToMailbox(
    row: NoticeOutboxModel,
    lockTransaction: Transaction,
  ): Promise<SendResult> {
    const report = await this.reportModel.findOne({
      where: { id: row.reportId },
      attributes: [
        'id',
        'type',
        'status',
        'validUntil',
        'approvedAt',
        'companyNationalId',
      ],
    })

    if (!report) {
      return { outcome: 'GONE', reason: 'report not found' }
    }

    const company = await this.companyReportModel.findOne({
      where: { reportId: row.reportId, parentCompanyId: null },
      attributes: ['companyId', 'name'],
      include: [FILING_COMPANY_OBLIGATION],
    })

    if (!company) {
      return { outcome: 'GONE', reason: 'filing company not found' }
    }

    const notOwed = await this.notOwed(row, report, company.companyId)
    if (notOwed) {
      return notOwed
    }

    const notice = await this.prepareMailboxNotice(
      row,
      report,
      company,
      lockTransaction,
    )

    if ('outcome' in notice) {
      return notice
    }

    const kind = MAILBOX_KINDS[row.kind][report.type]
    const result = await this.mailboxDeliveryService.deliverToMailbox({
      idempotencyKey: buildMailboxDeliveryIdempotencyKey({
        kind,
        companyId: company.companyId,
        // A UUID: hex, so the key's upper-casing cannot fold two into one.
        discriminator: report.id,
      }),
      kind,
      companyId: company.companyId,
      subject: notice.subject,
      pdf: notice.pdf,
    })

    return this.mailboxResult(result, notice.afterDone)
  }

  private async prepareMailboxNotice(
    row: NoticeOutboxModel,
    report: ReportModel,
    company: Pick<CompanyReportModel, 'name' | 'company'>,
    lockTransaction: Transaction,
  ): Promise<MailboxNotice | Gone> {
    const companyName = company.name

    switch (row.kind) {
      case NoticeOutboxKindEnum.REPORT_SUBMITTED: {
        // The row is written in the submit transaction, so its creation is
        // when the report was received.
        const letter = buildSubmittedLetter(report, companyName, row.createdAt)
        return {
          subject: letter.subject,
          pdf: () => this.renderLetter(letter.html),
        }
      }

      case NoticeOutboxKindEnum.REPORT_APPROVED: {
        // Filled by `pdf`, so what is archived is what was sent. Null when
        // `pdf` never ran in this run: a resume past CreateDocument, or a
        // delivery that was `alreadySent`.
        let sent: ReportMailAttachment[] | null = null

        return {
          subject: buildReportApprovedSubject(report),
          pdf: async () => {
            const attachments = await this.buildApprovalAttachments(
              report.type,
              report.id,
              lockTransaction,
              'send',
            )
            const letter = buildApprovedLetter(
              report,
              companyName,
              report.approvedAt ?? row.createdAt,
              attachments.map((attachment) => attachment.label),
              {
                // Same rule as the email: the mailbox letter replaces it.
                serviceSurvey: offersServiceSurvey(
                  report.type,
                  company.company?.salaryReportRequired ?? null,
                ),
              },
            )
            const merged = await mergePdfs([
              await this.renderLetter(letter.html),
              ...attachments.map((attachment) => attachment.content),
            ])
            sent = attachments
            return merged
          },
          afterDone: () =>
            sent
              ? this.archiveApprovalDocuments(report, sent)
              : this.archiveRenderedAgain(report, lockTransaction),
        }
      }

      case NoticeOutboxKindEnum.REPORT_DENIED: {
        const denied = await this.findDenial(report.id)

        if (!denied?.reason) {
          return { outcome: 'GONE', reason: 'denial reason not found' }
        }

        const letter = buildDeniedLetter(
          report,
          companyName,
          denied.createdAt,
          denied.reason,
        )
        return {
          subject: letter.subject,
          pdf: () => this.renderLetter(letter.html),
        }
      }

      default:
        return { outcome: 'GONE', reason: `unknown kind ${row.kind}` }
    }
  }

  private renderLetter(html: string): Promise<Buffer> {
    return this.pdfRenderService.renderHtml(html, noticeLetterStyles, 'letter')
  }

  /**
   * A thrown delivery never reaches here: `dispatchRow` treats it as a failed
   * send, and the next run resumes the same delivery by its key.
   */
  private mailboxResult(
    result: DeliverToMailboxResult,
    afterDone?: () => Promise<void>,
  ): SendResult {
    switch (result.status) {
      case 'SENT':
        return {
          outcome: ReportMailOutcome.SENT,
          channel: NoticeOutboxChannelEnum.MAILBOX,
          afterDone,
        }
      case 'UNCERTAIN':
        return {
          outcome: 'GONE',
          reason: `mailbox delivery ${result.deliveryId} is UNCERTAIN; check One before repeating anything`,
        }
      case 'IN_PROGRESS':
      case 'DISABLED':
        // Another worker holds the delivery, or the flag went off between the
        // check and the call. Either way, try again next run.
        return {
          outcome: ReportMailOutcome.FAILED,
          channel: NoticeOutboxChannelEnum.MAILBOX,
        }
      case 'QUARANTINED':
        // Quarantined between the pick and the call. Not an attempt: the row
        // waits, and is not picked again until the quarantine is lifted.
        return { outcome: 'HELD', reason: 'the filing company is quarantined' }
      case 'UNCONFIGURED':
        // The flag is on before the kind's case template is set. Not an
        // attempt, so nothing is spent and the row goes once the template
        // is; `deliverToMailbox` logged it at error, and the daily alert
        // names the kind and, once overdue, the row.
        return {
          outcome: 'HELD',
          reason: `mailbox kind ${result.kind} has no case template; waiting for it in mailbox-delivery.kinds.ts`,
          alert: true,
        }
      default:
        return {
          outcome: 'GONE',
          reason: `mailbox delivery ${result.deliveryId} used all its attempts`,
        }
    }
  }

  private async record(
    row: NoticeOutboxModel,
    result: SendResult,
  ): Promise<boolean> {
    const now = new Date()

    if (result.outcome === 'HELD') {
      this.logger[result.alert ? 'warn' : 'info'](
        `Holding notice ${row.kind} for report ${row.reportId}: ${result.reason}`,
        { context: LOGGING_CONTEXT, noticeId: row.id },
      )
      // Not an attempt, so `attempts` is untouched; `last_attempt_at` spaces
      // the next look by the retry delay.
      await this.noticeOutboxModel.update(
        { lastAttemptAt: now, lastError: result.reason },
        {
          where: { id: row.id, status: NoticeOutboxStatusEnum.PENDING },
          transaction: null,
        },
      )
      return false
    }

    if (result.outcome === 'NOT_OWED') {
      this.logger.warn(
        `Not sending notice ${row.kind} for report ${row.reportId}: ${result.reason}`,
        { context: LOGGING_CONTEXT, noticeId: row.id },
      )
      return this.settle(row, NoticeOutboxStatusEnum.SKIPPED, now, {
        channel: null,
        lastError: result.reason,
      })
    }

    if (result.outcome === 'GONE') {
      this.logger.error(
        `Gave up on notice ${row.kind} for report ${row.reportId}: ${result.reason}`,
        { context: LOGGING_CONTEXT, noticeId: row.id },
      )
      return this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
        channel: null,
        lastError: result.reason,
      })
    }

    const attempts = row.attempts + 1

    switch (result.outcome) {
      case ReportMailOutcome.SENT:
        return this.settle(row, NoticeOutboxStatusEnum.DONE, now, {
          channel: result.channel,
          lastError: null,
          attempts,
        })

      case ReportMailOutcome.NO_RECIPIENT:
        // Logged at error, not left to the mail service's warn: a decision
        // nobody was told about must reach error-level alerting.
        this.logger.error(
          `Notice ${row.kind} for report ${row.reportId} has no usable contact or admin email — giving up`,
          { context: LOGGING_CONTEXT, noticeId: row.id },
        )
        return this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
          channel: null,
          lastError: 'no usable contact or admin email',
          attempts,
        })

      case ReportMailOutcome.FAILED:
        if (attempts >= NOTICE_DISPATCH_MAX_ATTEMPTS) {
          this.logger.error(
            `Notice ${row.kind} for report ${row.reportId} failed ${attempts} times — giving up`,
            { context: LOGGING_CONTEXT, noticeId: row.id },
          )
          return this.settle(row, NoticeOutboxStatusEnum.FAILED, now, {
            channel: null,
            lastError: 'send failed',
            attempts,
          })
        }

        await this.noticeOutboxModel.update(
          { attempts, lastAttemptAt: now, lastError: 'send failed' },
          // Same guard as `settle`: a row already settled is left alone.
          {
            where: { id: row.id, status: NoticeOutboxStatusEnum.PENDING },
            transaction: null,
          },
        )
        return false
    }
  }

  /**
   * Returns whether this call moved the row out of PENDING. False means some
   * other path — a hand re-drive, a second dispatcher after the lock's
   * connection died — settled it first.
   */
  private async settle(
    row: NoticeOutboxModel,
    status: NoticeOutboxStatusEnum,
    now: Date,
    fields: {
      channel: NoticeOutboxChannelEnum | null
      lastError: string | null
      attempts?: number
    },
  ): Promise<boolean> {
    const [affected] = await this.noticeOutboxModel.update(
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

    if (affected === 0) {
      this.logger.warn(
        `Notice ${row.id} was no longer PENDING when recorded ${status} — left as it was`,
        { context: LOGGING_CONTEXT, noticeId: row.id },
      )
      return false
    }

    return true
  }

  /**
   * Tells the company its report was approved, with the approved document(s)
   * attached, and hands back the archiving of the documents to run once the
   * row is DONE.
   *
   * A render failure costs an attachment, never the notice: the notice is the
   * part that cannot be reconstructed later, and the documents can be
   * downloaded from the report screen.
   */
  private async sendApproved(
    reportId: string,
    lockTransaction: Transaction,
  ): Promise<SendResult> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: [
        'id',
        'type',
        'validUntil',
        'contactEmail',
        'companyAdminEmail',
        'companyNationalId',
        'status',
        // Dates the S3 key — see `archiveApprovalDocuments`.
        'approvedAt',
      ],
    })

    if (!report) {
      return { outcome: 'GONE', reason: 'report not found' }
    }

    // `startedInMailbox` has already found no delivery in One to finish.
    const notOwed = notOwedByStatus(
      NoticeOutboxKindEnum.REPORT_APPROVED,
      report,
    )
    if (notOwed) {
      return notOwed
    }

    const attachments = await this.buildApprovalAttachments(
      report.type,
      reportId,
      lockTransaction,
      'send',
    )

    // The filing company's own snapshot row; a group report also has one per
    // subsidiary, each with `parentCompanyId` set.
    const snapshot = await this.companyReportModel.findOne({
      where: { reportId, parentCompanyId: null },
      attributes: ['companyId'],
      include: [FILING_COMPANY_OBLIGATION],
    })

    const outcome = await this.mailService.sendReportApproved(
      report,
      attachments,
      {
        serviceSurvey: offersServiceSurvey(
          report.type,
          snapshot?.company?.salaryReportRequired ?? null,
        ),
      },
    )

    if (outcome !== ReportMailOutcome.SENT) {
      return { outcome, channel: NoticeOutboxChannelEnum.EMAIL }
    }

    /*
     * ⚠️ **After the send, and only when it landed.** Archiving is secondary:
     * the company having its documents is the point, keeping our own copy is the
     * record. Uploading first would let an unset or misconfigured bucket stop
     * the notification. And the archive is the Directorate's copy of what the
     * company received, so writing it after a failed send would put a false yes
     * in it. The reverse does not hold: a missing archive does not mean the
     * send failed (see the class note on dying after DONE).
     *
     * ⚠️ **After the DONE write, too.** Up to two S3 uploads with SDK retries
     * take seconds; run before the write, a deploy landing in them would kill
     * the process after the mail and before DONE, and the next run would mail
     * the company again. `archive` never throws.
     */
    return {
      outcome,
      channel: NoticeOutboxChannelEnum.EMAIL,
      afterDone: () => this.archiveApprovalDocuments(report, attachments),
    }
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
      // Every render this report kind asks for failed, each already logged
      // at error. Said again here so the missing archive has its own line.
      this.logger.warn(
        `No approval documents to archive for report ${report.id} — every render failed`,
        { context: LOGGING_CONTEXT },
      )
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
   * Archives an approval's documents when they were not rendered in this run:
   * a mailbox delivery that resumed past CreateDocument, or was already sent,
   * never calls `pdf`. An approved report's documents do not change and the
   * S3 key is fixed by the report, so rendering them again files the same
   * copy the company was sent. Never throws.
   */
  private async archiveRenderedAgain(
    report: Pick<
      ReportModel,
      'id' | 'type' | 'companyNationalId' | 'approvedAt'
    >,
    lockTransaction: Transaction,
  ): Promise<void> {
    const attachments = await this.buildApprovalAttachments(
      report.type,
      report.id,
      lockTransaction,
      'archive',
    )
    await this.archiveApprovalDocuments(report, attachments)
  }

  /**
   * The documents an approval mails, by report kind.
   *
   * An equality approval carries the report. A salary approval carries the
   * report and the úrbótaáætlun as two documents, because the second is what the
   * company committed to rather than what the Directorate assessed, and filing
   * them together would bury it.
   *
   * Each render is guarded on its own, and runs in its own savepoint, so one
   * failing — even on a DB error — costs only its own attachment. Empty means
   * every render failed: the notice still goes, and `buildReportApprovedHtml`
   * omits the "Skjalið er í viðhengi" line.
   *
   * `purpose` only words the log: rendered again for the archive after the
   * notice went out (`archiveRenderedAgain`), a failure costs the archive
   * copy, not anything the company receives.
   */
  private async buildApprovalAttachments(
    type: ReportTypeEnum,
    reportId: string,
    lockTransaction: Transaction,
    purpose: 'send' | 'archive',
  ): Promise<ReportMailAttachment[]> {
    let reportAttachment: ReportMailAttachment | null = null

    try {
      const { pdf, fileName } = await this.inSavepoint(lockTransaction, () =>
        this.reportPdfService.generateReportPdf(reportId),
      )

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
        purpose === 'send'
          ? `Failed to render the report PDF for approved report ${reportId} — sending the approval notice without it`
          : `Failed to render the report PDF for approved report ${reportId} again — the notice already went out; not archived`,
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
      plan = await this.inSavepoint(lockTransaction, () =>
        this.reportPdfService.generateImprovementPlanPdf(reportId),
      )
    } catch (error) {
      this.logger.error(
        purpose === 'send'
          ? `Failed to render the úrbótaáætlun for report ${reportId} — mailing the report alone`
          : `Failed to render the úrbótaáætlun for report ${reportId} again — the notice already went out; not archived`,
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
      attributes: ['id', 'type', 'status', 'contactEmail', 'companyAdminEmail'],
    })

    if (!report) {
      return { outcome: 'GONE', reason: 'report not found' }
    }

    // `startedInMailbox` has already found no delivery in One to finish.
    const notOwed = notOwedByStatus(NoticeOutboxKindEnum.REPORT_DENIED, report)
    if (notOwed) {
      return notOwed
    }

    const deniedEvent = await this.findDenial(reportId)

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

  /** The denial's STATUS_CHANGED event, which holds the reviewer's reason. */
  private findDenial(reportId: string): Promise<ReportEventModel | null> {
    return this.reportEventModel.findOne({
      where: {
        reportId,
        eventType: ReportEventTypeEnum.STATUS_CHANGED,
        toStatus: ReportStatusEnum.DENIED,
      },
      attributes: ['reason', 'createdAt'],
      order: [['createdAt', 'DESC']],
    })
  }
}

/** `NOT_OWED` when the report no longer has a status `kind` is owed in. */
function notOwedByStatus(
  kind: NoticeOutboxKindEnum,
  report: Pick<ReportModel, 'status'>,
): NotOwed | null {
  return OWED_WHILE[kind].includes(report.status)
    ? null
    : {
        outcome: 'NOT_OWED',
        reason: `report is ${report.status}; a ${kind} notice is no longer owed`,
      }
}
