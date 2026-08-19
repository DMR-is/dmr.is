import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyStatusEnum } from '../../modules/company/models/company.enums'
import { CompanyModel } from '../../modules/company/models/company.model'
import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
  EmailReminderTier,
  MailboxReminderTier,
} from '../../modules/company/models/company-event.model'
import { ICompanyEventService } from '../../modules/company-event/company-event.service.interface'
import { IDoeMailService } from '../../modules/mail/doe-mail.service.interface'
import { buildNoticeDocumentId } from '../../modules/postholf/lib/document-id'
import { INoticePdfService } from '../../modules/postholf/notice-pdf.service.interface'
import { INoticeStoreService } from '../../modules/postholf/notice-store.service.interface'
import { PostholfService } from '../../modules/postholf/postholf.service'
import { IPostholfService } from '../../modules/postholf/postholf.service.interface'
import { ReportTypeEnum } from '../../modules/report/models/report.enums'
import { REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT } from '../constants'
import { IReportDeadlineReminderService } from './report-deadline-reminder.service.interface'

const LOGGING_CONTEXT = REPORT_DEADLINE_REMINDER_LOGGING_CONTEXT

/** One row of the deadline matrix the task walks — equality and salary. */
type DeadlineKind = {
  /** Company column holding the due date. */
  dueField: 'nextEqualityReportDueAt' | 'nextSalaryReportDueAt'
  reportType: ReportTypeEnum
  /** Event recorded once an email reminder is sent. */
  sentEventType: CompanyDeadlineReminderEventType
  /** Event recorded when an email reminder is due but no email is on file. */
  noEmailEventType: CompanyDeadlineReminderEventType
  /** Event recorded once a mailbox notice is registered with Pósthólf. */
  mailboxEventType: CompanyDeadlineReminderEventType
}

const DEADLINE_KINDS: DeadlineKind[] = [
  {
    dueField: 'nextEqualityReportDueAt',
    reportType: ReportTypeEnum.EQUALITY,
    sentEventType: CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
    mailboxEventType: CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT,
  },
  {
    dueField: 'nextSalaryReportDueAt',
    reportType: ReportTypeEnum.SALARY,
    sentEventType: CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_SENT,
    noEmailEventType:
      CompanyEventTypeEnum.SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL,
    mailboxEventType: CompanyEventTypeEnum.SALARY_MAILBOX_NOTICE_SENT,
  },
]

/**
 * Days past the due date at which the Áminning (post-expiry) notice fires — and
 * therefore also the floor of the DUE tier, since the bands are contiguous.
 *
 * ⚠️ PLUG IN: Þorri's flowchart carries the real offsets. The default of 30 is
 * chosen so that **DUE's band is unchanged from before this feature existed**
 * (its floor was a hard-coded 30 days), which makes the split provably
 * behaviour-preserving for the email tiers. Change it and DUE narrows or widens
 * with it — that is the intended coupling, not an accident.
 */
const OVERDUE_NOTICE_AFTER_DAYS = 30

/**
 * Days past the due date at which the Undanfari-að-dagsektum notice fires.
 *
 * ⚠️ PLUG IN: see above. Must be greater than `OVERDUE_NOTICE_AFTER_DAYS`;
 * `report-deadline-reminder.service.spec.ts` asserts it.
 */
const FINES_PRECURSOR_AFTER_DAYS = 60

/**
 * The reminder milestones, far to near. Each owns a contiguous band of due dates
 * down to the next tier, so a deadline falls in exactly one tier per run (and a
 * missed run still leaves it inside the band next time). `dueRange` builds the
 * half-open `(lower, upper]` window for the given `now`.
 *
 * The four email tiers are unchanged. The two mailbox tiers extend the ladder
 * *below* DUE, which is a split of DUE's old floor rather than a raising of it:
 * raising the floor would have let DUE swallow the new bands so they never fired.
 *
 * The terminal tier is deliberately **unbounded below** — a company far enough
 * past due must still reach the legal-referral step, which is the case the
 * Directorate cares most about. What bounds it instead is
 * `POSTHOLF_GO_LIVE_DATE`; without that gate the first run after deploy would
 * serve a legal notice to the entire existing overdue backlog.
 */
type Tier = {
  tier: CompanyReminderTierEnum
  dueRange: (now: Date) => WhereOptions
} & ({ channel: 'EMAIL'; tier: EmailReminderTier } | { channel: 'MAILBOX'; tier: MailboxReminderTier })

const TIERS: Tier[] = [
  {
    channel: 'EMAIL',
    tier: CompanyReminderTierEnum.SIX_MONTHS,
    dueRange: (now) => ({
      [Op.gt]: addMonths(now, 2),
      [Op.lte]: addMonths(now, 6),
    }),
  },
  {
    channel: 'EMAIL',
    tier: CompanyReminderTierEnum.TWO_MONTHS,
    dueRange: (now) => ({
      [Op.gt]: addDays(now, 14),
      [Op.lte]: addMonths(now, 2),
    }),
  },
  {
    channel: 'EMAIL',
    tier: CompanyReminderTierEnum.TWO_WEEKS,
    dueRange: (now) => ({ [Op.gt]: now, [Op.lte]: addDays(now, 14) }),
  },
  {
    channel: 'EMAIL',
    tier: CompanyReminderTierEnum.DUE,
    dueRange: (now) => ({
      [Op.gt]: addDays(now, -OVERDUE_NOTICE_AFTER_DAYS),
      [Op.lte]: now,
    }),
  },
  {
    channel: 'MAILBOX',
    tier: CompanyReminderTierEnum.OVERDUE_NOTICE,
    dueRange: (now) => ({
      [Op.gt]: addDays(now, -FINES_PRECURSOR_AFTER_DAYS),
      [Op.lte]: addDays(now, -OVERDUE_NOTICE_AFTER_DAYS),
    }),
  },
  {
    channel: 'MAILBOX',
    tier: CompanyReminderTierEnum.FINES_PRECURSOR,
    // No floor: see the note on Tier. `POSTHOLF_GO_LIVE_DATE` bounds this.
    dueRange: (now) => ({ [Op.lte]: addDays(now, -FINES_PRECURSOR_AFTER_DAYS) }),
  },
]

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Exported for the spec, which asserts the band invariants directly. */
export const REMINDER_TIERS_FOR_TEST = TIERS
export const TIER_OFFSETS_FOR_TEST = {
  OVERDUE_NOTICE_AFTER_DAYS,
  FINES_PRECURSOR_AFTER_DAYS,
}

@Injectable()
export class ReportDeadlineReminderService
  implements IReportDeadlineReminderService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(IDoeMailService)
    private readonly mailService: IDoeMailService,
    @Inject(IPostholfService)
    private readonly postholfService: IPostholfService,
    @Inject(INoticePdfService)
    private readonly noticePdfService: INoticePdfService,
    @Inject(INoticeStoreService)
    private readonly noticeStoreService: INoticeStoreService,
  ) {}

  async run(): Promise<void> {
    const now = new Date()

    for (const kind of DEADLINE_KINDS) {
      for (const tier of TIERS) {
        await this.processTier(kind, tier, now)
      }
    }
  }

  /**
   * Cut-off before which mailbox notices are never sent.
   *
   * Returns `null` when unset, which **disables the mailbox tiers entirely**.
   * That is the safe default on purpose: the two mailbox bands reach back
   * indefinitely, so an unconfigured deploy would otherwise serve a legal notice
   * to every company in the existing overdue backlog on its first 6am run.
   */
  private mailboxGoLiveDate(): Date | null {
    const raw = process.env.POSTHOLF_GO_LIVE_DATE
    if (!raw) return null

    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) {
      this.logger.error(
        'POSTHOLF_GO_LIVE_DATE is set but unparseable — mailbox notices are disabled',
        { context: LOGGING_CONTEXT, value: raw },
      )
      return null
    }

    return parsed
  }

  private async processTier(
    kind: DeadlineKind,
    tier: Tier,
    now: Date,
  ): Promise<void> {
    const goLive =
      tier.channel === 'MAILBOX' ? this.mailboxGoLiveDate() : undefined

    if (tier.channel === 'MAILBOX' && !goLive) {
      this.logger.info(
        `Skipping ${tier.tier} — POSTHOLF_GO_LIVE_DATE is not set`,
        { context: LOGGING_CONTEXT, tier: tier.tier },
      )
      return
    }

    // Active, non-quarantined companies whose deadline currently sits in this
    // tier's band. `quarantined` is an admin halt switch — no outbound activity
    // for those companies (see PR #1321) — so they are excluded at the query
    // level. Per-tier dedup happens per-company below.
    //
    // Mailbox tiers additionally floor the band at POSTHOLF_GO_LIVE_DATE.
    const companies = await this.companyModel.findAll({
      where: {
        status: CompanyStatusEnum.ACTIVE,
        quarantined: false,
        [kind.dueField]: goLive
          ? { ...tier.dueRange(now), [Op.gte]: goLive }
          : tier.dueRange(now),
      },
    })

    if (companies.length > 0) {
      this.logger.info(
        `Found ${companies.length} companies in ${tier.tier} band for ${kind.reportType}`,
        {
          context: LOGGING_CONTEXT,
          reportType: kind.reportType,
          tier: tier.tier,
          channel: tier.channel,
        },
      )
    }

    for (const company of companies) {
      if (tier.channel === 'MAILBOX') {
        await this.serveMailboxNotice(company, kind, tier.tier)
      } else {
        await this.remindCompany(company, kind, tier.tier)
      }
    }
  }

  private async remindCompany(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: EmailReminderTier,
  ): Promise<void> {
    const dueDate = company[kind.dueField]
    if (!dueDate) return

    const dueDateIso = dueDate.toISOString()

    const alreadySent = await this.companyEventService.hasDeadlineReminderEvent(
      company.id,
      kind.sentEventType,
      tier,
      dueDateIso,
    )
    if (alreadySent) return

    const to = company.email
    if (!to) {
      await this.flagMissingEmail(company, kind, tier, dueDateIso)
      return
    }

    await this.mailService.sendReportDeadlineReminder(to, {
      companyName: company.name,
      reportType: kind.reportType,
      tier,
      dueDate,
    })

    // Only recorded after a successful send, so a failed send retries next run.
    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.sentEventType,
      tier,
      dueDateIso,
    )
  }

  /**
   * Serves one notice into the company's island.is mailbox.
   *
   * Order is load-bearing: render → store → register → emit event.
   *
   *  - A render or upload failure has announced nothing and recorded nothing, so
   *    the next run retries cleanly.
   *  - A registration failure leaves an orphan object, which is harmless because
   *    the key is derived from the documentId and a retry overwrites it.
   *  - The event row is written last, so its existence means "stored **and**
   *    announced" — exactly the precondition the Skjalaveita callback asserts
   *    before serving the document.
   *
   * There is no NO_EMAIL counterpart: delivery keys off `company.nationalId`,
   * which is NOT NULL, so the missing-contact-details outcome cannot arise.
   */
  private async serveMailboxNotice(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: MailboxReminderTier,
  ): Promise<void> {
    const dueDate = company[kind.dueField]
    if (!dueDate) return

    const dueDateIso = dueDate.toISOString()

    const alreadySent = await this.companyEventService.hasDeadlineReminderEvent(
      company.id,
      kind.mailboxEventType,
      tier,
      dueDateIso,
    )
    if (alreadySent) return

    if (!PostholfService.isEnabled()) {
      // Dry run. Deliberately the same query and the same dedup check as a live
      // run, so the count reported here is exactly what enabling would send.
      this.logger.info(
        `[dry run] Would serve ${tier} ${kind.reportType} notice to company ${company.id}`,
        {
          context: LOGGING_CONTEXT,
          companyId: company.id,
          tier,
          reportType: kind.reportType,
          dueDateIso,
        },
      )
      return
    }

    const secret = process.env.POSTHOLF_DOCUMENT_ID_SECRET
    if (!secret) {
      this.logger.error(
        'POSTHOLF_DOCUMENT_ID_SECRET is not set — cannot serve mailbox notices',
        { context: LOGGING_CONTEXT, tier },
      )
      return
    }

    if (await this.postholfService.wantsPaper(company.nationalId)) {
      // A legal opt-out. Nothing in the DoE model records it, so it is surfaced
      // loudly and left for Jafnréttisstofa's postal process rather than being
      // silently served electronically. No event is emitted: the notice was not
      // delivered, and recording one would suppress the retry if the preference
      // is later cleared.
      this.logger.warn(
        `Company ${company.id} has opted into paper delivery — ${tier} ${kind.reportType} notice not served electronically`,
        {
          context: LOGGING_CONTEXT,
          companyId: company.id,
          tier,
          reportType: kind.reportType,
        },
      )
      return
    }

    const documentId = buildNoticeDocumentId({
      nationalId: company.nationalId,
      reportType: kind.reportType,
      tier,
      dueDate,
      secret,
    })

    // `now` rather than the event's createdAt: on this path no event exists yet.
    // A retry re-renders with a later issue date, which is acceptable because the
    // earlier attempt was never announced. Once the event exists, the document is
    // frozen in storage and never re-rendered.
    const issueDate = new Date()

    const pdf = await this.noticePdfService.render({
      companyName: company.name,
      companyNationalId: company.nationalId,
      companyAddress: company.address,
      reportType: kind.reportType,
      tier,
      dueDate,
      issueDate,
    })

    await this.noticeStoreService.put(company.nationalId, documentId, pdf)

    const result = await this.postholfService.registerNotice({
      nationalId: company.nationalId,
      documentId,
      reportType: kind.reportType,
      tier,
      dueDate,
      documentDate: issueDate,
    })

    if (!result.success) {
      // Pósthólf answers 200 with a per-item success flag, so this is the only
      // place that knows whether the notice actually landed. No event is
      // emitted, so the next run retries against the same derived documentId.
      this.logger.error(
        `Pósthólf did not accept the ${tier} ${kind.reportType} notice for company ${company.id}`,
        {
          context: LOGGING_CONTEXT,
          companyId: company.id,
          tier,
          reportType: kind.reportType,
          documentId,
          errors: result.errors,
        },
      )
      return
    }

    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.mailboxEventType,
      tier,
      dueDateIso,
    )

    this.logger.info(
      `Served ${tier} ${kind.reportType} notice to company ${company.id}`,
      {
        context: LOGGING_CONTEXT,
        companyId: company.id,
        tier,
        reportType: kind.reportType,
        documentId,
      },
    )
  }

  /**
   * Records a NO_EMAIL event on the company timeline so the gap is visible to
   * admins. Deduped per (tier, due date) — same key as the sent event — so a
   * company with no email gets one event per tier per cycle, not one per run.
   *
   * Email tiers only. The mailbox tiers cannot reach this path.
   */
  private async flagMissingEmail(
    company: CompanyModel,
    kind: DeadlineKind,
    tier: EmailReminderTier,
    dueDateIso: string,
  ): Promise<void> {
    const alreadyFlagged =
      await this.companyEventService.hasDeadlineReminderEvent(
        company.id,
        kind.noEmailEventType,
        tier,
        dueDateIso,
      )
    if (alreadyFlagged) return

    this.logger.warn(
      `Tried to send ${kind.reportType} ${tier} reminder for company ${company.id} but no email is on file`,
      {
        context: LOGGING_CONTEXT,
        companyId: company.id,
        reportType: kind.reportType,
        tier,
      },
    )

    await this.companyEventService.emitDeadlineReminderEvent(
      company.id,
      company.status,
      kind.noEmailEventType,
      tier,
      dueDateIso,
    )
  }
}
