import { getNamespace } from 'cls-hooked'
import { Transaction } from 'sequelize'

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IApplicationSystemService } from '../application-system/application-system.service.interface'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ICompanyFileService } from '../company-file/company-file.service.interface'
import {
  IDoeMailService,
  ReportMailAttachment,
} from '../mail/doe-mail.service.interface'
import {
  CommunicationStatusEnum,
  ReportModel,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportEventService } from '../report-event/report-event.service.interface'
import {
  IReportPdfService,
  ReportPdfResult,
} from '../report-pdf/report-pdf.service.interface'
import { UserModel } from '../user/models/user.model'
import { AssignReportDto } from './dto/assign-report.dto'
import { DenyReportDto } from './dto/deny-report.dto'
import { IReportWorkflowService } from './report-workflow.service.interface'

const LOGGING_CONTEXT = 'ReportWorkflowService'

@Injectable()
export class ReportWorkflowService implements IReportWorkflowService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportEventService)
    private readonly reportEventService: IReportEventService,
    @Inject(IApplicationSystemService)
    private readonly applicationSystemService: IApplicationSystemService,
    @Inject(IDoeMailService)
    private readonly mailService: IDoeMailService,
    @Inject(IReportPdfService)
    private readonly reportPdfService: IReportPdfService,
    @Inject(ICompanyFileService)
    private readonly companyFileService: ICompanyFileService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly reportOutlierGroupModel: typeof ReportOutlierGroupModel,
  ) {}

  async assign(
    context: ReportResourceContext,
    dto: AssignReportDto,
  ): Promise<void> {
    this.logger.info(`Assigning report ${context.reportId} to reviewer`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may assign reports')
    }

    const actorUserId = context.actor.userId

    // Resolve target reviewer:
    // - undefined → assign to caller
    // - UUID → assign to that user (must be active)
    // - null → unassign
    const targetUserId = dto.userId === undefined ? actorUserId : dto.userId

    if (targetUserId !== null) {
      const targetUser = await this.userModel.findOne({
        where: { id: targetUserId },
        attributes: ['id', 'isActive'],
      })

      if (!targetUser || !targetUser.isActive) {
        throw new BadRequestException(
          `Target reviewer ${targetUserId} is not an active user`,
        )
      }
    }

    // A reviewer is only meaningful while the report is in the review pipeline,
    // whether or not this call moves it along.
    if (
      context.reportStatus !== ReportStatusEnum.SUBMITTED &&
      context.reportStatus !== ReportStatusEnum.IN_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot assign report with status ${context.reportStatus}`,
      )
    }

    // `updateStatus` decides whether this is "take this report" or a plain
    // reviewer change. Defaults to the former to keep the pipeline transition
    // the behaviour a caller gets without asking.
    // - false                → status untouched
    // - SUBMITTED + target   → IN_REVIEW
    // - SUBMITTED + null     → 400 (nothing to hand back)
    // - IN_REVIEW + target   → IN_REVIEW (reassignment)
    // - IN_REVIEW + null     → SUBMITTED (return to queue)
    let nextStatus: ReportStatusEnum
    if (dto.updateStatus === false) {
      nextStatus = context.reportStatus
    } else if (context.reportStatus === ReportStatusEnum.SUBMITTED) {
      if (targetUserId === null) {
        throw new BadRequestException(
          'Cannot unassign a report that is not in review',
        )
      }
      nextStatus = ReportStatusEnum.IN_REVIEW
    } else {
      nextStatus =
        targetUserId === null
          ? ReportStatusEnum.SUBMITTED
          : ReportStatusEnum.IN_REVIEW
    }

    const currentReviewerUserId = await this.getReviewerUserId(context.reportId)

    // No-op: same reviewer, same status. Skip writing the event log.
    if (
      currentReviewerUserId === targetUserId &&
      context.reportStatus === nextStatus
    ) {
      return
    }

    await this.reportModel.update(
      { status: nextStatus, reviewerUserId: targetUserId },
      { where: { id: context.reportId } },
    )

    if (targetUserId === null) {
      await this.reportEventService.emitUnassigned(
        context.reportId,
        actorUserId,
        currentReviewerUserId,
        nextStatus,
      )
    } else {
      await this.reportEventService.emitAssigned(
        context.reportId,
        actorUserId,
        targetUserId,
        nextStatus,
      )
    }
  }

  /**
   * Defers irrevocable outbound work — email, S3, island.is — until the
   * request's transaction has actually committed.
   *
   * **Why this is needed at all.** `Sequelize.useCLS` plus
   * `CLSMiddleware.forRoutes('*')` puts every query in one ambient transaction
   * that the middleware commits in `res.on('finish')`, i.e. AFTER the response.
   * Sending inside that window meant a company could be emailed "samþykkt" and
   * then have the approval rolled back underneath it — a 500 raised later in the
   * handler (or a failing commit) discards the writes while the mail, the S3
   * object and the island.is callback all stand.
   *
   * **Why the reads inside the hook are safe.** `Transaction.commit` runs
   * `cleanup()` → `_clearCls()` BEFORE it awaits these hooks, which nulls the
   * CLS `transaction` entry and releases the connection. So queries made from
   * here take a fresh pooled connection with no ambient transaction, rather than
   * joining a finished one.
   *
   * **Why it also fixes the latency.** `res.on('finish')` fires after the
   * response is flushed, so the reviewer's approve returns before the PDFs
   * render instead of waiting seconds for them.
   *
   * ⚠️ **The callback MUST NOT THROW.** Sequelize awaits these hooks inside
   * `commit()`'s `finally`, and `CLSMiddleware` calls `commit()` from an
   * un-awaited `res.on('finish')` callback — so a rejection here becomes an
   * unhandled rejection with no request left to attach it to. Hence the
   * catch-all below; do not remove it, and do not rely on callers being
   * total.
   *
   * ⚠️ **Still no durable record.** If the process dies between commit and send,
   * the report is approved and the company was never told, with nothing to retry
   * from. Closing that needs the intent-to-send persisted inside the
   * transaction; tracked separately.
   */
  private async runAfterCommit(
    label: string,
    work: () => Promise<void>,
  ): Promise<void> {
    const transaction = getNamespace(CLS_NAMESPACE)?.get('transaction') as
      | Transaction
      | undefined

    if (!transaction) {
      // No ambient transaction: a unit test, or a caller outside the HTTP
      // pipeline. There is nothing to wait for, so the old inline behaviour is
      // still the correct one.
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

  private async getReviewerUserId(reportId: string): Promise<string | null> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['reviewerUserId'],
    })
    return report?.reviewerUserId ?? null
  }

  async deny(
    context: ReportResourceContext,
    dto: DenyReportDto,
  ): Promise<void> {
    this.logger.info(`Denying report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may deny reports')
    }

    // POSTPONED is deniable alongside IN_REVIEW: a report parked on postponed
    // outliers blocks the company from submitting a replacement, so reviewers
    // need a way to close it out when the applicant never resolves them.
    const deniableStatuses: ReportStatusEnum[] = [
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.POSTPONED,
    ]
    if (!deniableStatuses.includes(context.reportStatus)) {
      throw new BadRequestException(
        `Cannot deny report with status ${context.reportStatus}`,
      )
    }

    const denialReason = dto.denialReason.trim()

    if (!denialReason) {
      throw new BadRequestException('Denial reason cannot be empty')
    }

    const actorUserId = context.actor.userId

    await this.reportModel.update(
      {
        status: ReportStatusEnum.DENIED,
        reviewerUserId: actorUserId,
      },
      { where: { id: context.reportId } },
    )

    await this.reportEventService.emitStatusChanged(
      context.reportId,
      context.reportStatus,
      ReportStatusEnum.DENIED,
      actorUserId,
      denialReason,
    )

    await this.forceCloseCommunication(context.reportId)

    // Both outbound calls are irrevocable, so neither may happen before the
    // denial is durable. See `runAfterCommit`.
    await this.runAfterCommit('denial notification', async () => {
      await this.notifyCompanyDenied(context.reportId, denialReason)
      await this.notifyApplicationSystem(
        context.reportId,
        ReportStatusEnum.DENIED,
      )
    })
  }

  async approve(context: ReportResourceContext): Promise<void> {
    this.logger.info(`Approving report ${context.reportId}`, {
      context: LOGGING_CONTEXT,
    })

    if (context.actor.kind !== ReportRoleEnum.REVIEWER) {
      throw new ForbiddenException('Only reviewers may approve reports')
    }

    if (context.reportStatus !== ReportStatusEnum.IN_REVIEW) {
      throw new BadRequestException(
        `Cannot approve report with status ${context.reportStatus}`,
      )
    }

    await this.assertOutlierExplanationsResolved(context.reportId)

    const actorUserId = context.actor.userId
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setFullYear(validUntil.getFullYear() + 3)

    /*
     * ⚠️ **Compare-and-swap: the transition itself is the gate.**
     *
     * The status check above reads `context.reportStatus`, resolved earlier in
     * the request. Two concurrent approvals both see IN_REVIEW; the second blocks
     * on the row lock and then its `WHERE id = X` re-evaluates happily under READ
     * COMMITTED. That used to be a near-idempotent duplicate write. It is not any
     * more: a second approval now means a second email WITH ATTACHMENTS to the
     * company, a second STATUS_CHANGED, a second due-date advance and a second S3
     * object.
     *
     * Adding `status` to the WHERE and reading the affected-row count makes the
     * update the only thing that decides whether this is the approval — and it
     * costs nothing.
     */
    const [affected] = await this.reportModel.update(
      {
        status: ReportStatusEnum.APPROVED,
        approvedAt: now,
        validUntil,
        reviewerUserId: actorUserId,
      },
      {
        where: {
          id: context.reportId,
          status: ReportStatusEnum.IN_REVIEW,
        },
      },
    )

    if (affected === 0) {
      this.logger.info(
        `Report ${context.reportId} was already moved out of IN_REVIEW; skipping duplicate approval`,
        { context: LOGGING_CONTEXT },
      )
      return
    }

    // Keep the company's next-due date in step with the report's validity. The
    // launch seed sets these dates initially (no reports exist yet); from then
    // on every approval advances them, so `next_*_report_due_at` stays the live
    // source of truth the salary renewal-window check reads.
    await this.advanceCompanyReportDueDate(context.reportId, validUntil)

    await this.supersedePreviousApproved(context.reportId)

    await this.reportEventService.emitStatusChanged(
      context.reportId,
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.APPROVED,
      actorUserId,
    )

    await this.forceCloseCommunication(context.reportId)

    // Two PDF renders, an email, an S3 upload and the island.is callback — every
    // one irrevocable, and none of them may happen until the approval is
    // durable. See `runAfterCommit`.
    await this.runAfterCommit('approval notification', async () => {
      await this.notifyCompanyApproved(context.reportId)
      await this.notifyApplicationSystem(
        context.reportId,
        ReportStatusEnum.APPROVED,
      )
    })

    // TODO: insert public_report row as part of approval pipeline
  }

  /**
   * Concluding a review (approve/deny) closes the applicant conversation: a
   * finalized report accepts no further replies, so communication moves to
   * CLOSED from ANY state. Silent — the STATUS_CHANGED event for the
   * approval/denial is already the audit record of why the thread closed.
   */
  private async forceCloseCommunication(reportId: string): Promise<void> {
    await this.reportModel.update(
      { communicationStatus: CommunicationStatusEnum.CLOSED },
      { where: { id: reportId } },
    )
  }

  /**
   * Tells the company its report was approved, with the approved document(s)
   * attached.
   *
   * ⚠️ **This renders PDFs inside the reviewer's request.** `generateReportPdf`
   * launches and closes a headless browser, so approving costs seconds, not
   * milliseconds. That is accepted deliberately: there is no queue in this repo
   * (only `@nestjs/schedule` + `AdvisoryLockService`), and a deferred send would
   * need a pending-state column and a third task to carry it. If approval
   * latency becomes a complaint, the fix is to share one browser across the two
   * salary PDFs before it is to introduce a queue.
   *
   * Runs from `runAfterCommit`, which changes two things that used to be wrong.
   *
   * The approval, the due-date advance, the supersede and the audit event are all
   * **committed** before this executes, so the mail can no longer be rolled back
   * out from under the company. And the renders no longer hold the request's
   * transaction or its pooled connection — the response has already been sent, so
   * the seconds they cost are nobody's latency.
   *
   * Best-effort throughout: neither a render failure nor a send failure may
   * surface, and per `runAfterCommit` nothing here may throw.
   */
  private async notifyCompanyApproved(reportId: string): Promise<void> {
    try {
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
        this.logger.warn(
          `Approved report ${reportId} vanished before its notification could be sent`,
          { context: LOGGING_CONTEXT },
        )
        return
      }

      const attachments = await this.buildApprovalAttachments(report.type, reportId)

      await this.mailService.sendReportApproved(report, attachments)

      // ⚠️ **After the send, deliberately.** Archiving is secondary: the company
      // having its documents is the point, keeping our own copy is the record.
      // Uploading first would let an unset or misconfigured bucket stop the
      // notification — the exact failure mode to avoid while the bucket is still
      // being provisioned. `archive` never throws, so this cannot reach the
      // catch below either.
      await this.archiveApprovalDocuments(report, attachments)
    } catch (error) {
      this.logger.error(
        `Failed to notify company of approval for report ${reportId}`,
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
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
     * from the report", and the only date on the report is `approvedAt`. Since
     * archiving happens after up to two renders, a wall-clock stamp files an
     * approval made near midnight under the following day — and the retrieval
     * story that excuses having no `s3_key` column then breaks silently.
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
   */
  private async buildApprovalAttachments(
    type: ReportTypeEnum,
    reportId: string,
  ): Promise<ReportMailAttachment[]> {
    const { pdf, fileName } =
      await this.reportPdfService.generateReportPdf(reportId)

    const reportAttachment: ReportMailAttachment = {
      filename: fileName,
      content: pdf,
      label:
        type === ReportTypeEnum.SALARY ? 'jafnlaunaúttekt' : 'jafnréttisáætlun',
    }

    if (type !== ReportTypeEnum.SALARY) {
      return [reportAttachment]
    }

    /*
     * ⚠️ **Its own try/catch, so a failed plan render still mails the report.**
     *
     * `null` means "no plan to state" and was handled; a THROW was not. Because
     * this runs before `sendReportApproved`, a single failing plan render —
     * chromium dying, a malformed group — took the whole notification with it:
     * no mail, no report PDF, nothing to the company, on an approval where the
     * report itself had rendered perfectly.
     *
     * The report is the part the company must have, which is this feature's own
     * stated priority, so the plan degrades to absent rather than fatal. Logged
     * at error because unlike `null` this IS a fault: the plan exists and could
     * not be produced.
     */
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

    // Null for a compliant company with no outlier groups — there is no plan to
    // state, and the salary report itself carries that as a finding.
    if (!plan) {
      return [reportAttachment]
    }

    return [
      reportAttachment,
      {
        filename: plan.fileName,
        content: plan.pdf,
        label: 'úrbótaáætlun',
      },
    ]
  }

  /**
   * Tells the company its report was denied, with the reviewer's reason as the
   * body.
   *
   * Loads its own narrow projection rather than taking a model from `deny`,
   * which only ever issues an `update` and never holds an instance. The four
   * attributes are exactly what the mail needs: `type` picks the subject noun,
   * the two addresses resolve the recipient, `id` labels the log line.
   *
   * Runs from `runAfterCommit`, so the denial IS committed by the time this is
   * called — the ambient CLS transaction has already been committed and its
   * connection released. That is what makes emailing the company safe here: it
   * cannot be rolled back underneath the mail.
   *
   * Still best-effort. The denial is durable, so a failed send must not surface
   * to the reviewer; it is logged. And it must not throw at all — see the
   * warning on `runAfterCommit`. `IDoeMailService.sendReportDenied` already swallows its
   * own send errors; the try/catch here covers the load, so a missing or
   * unreadable row cannot take the denial down with it either.
   */
  private async notifyCompanyDenied(
    reportId: string,
    denialReason: string,
  ): Promise<void> {
    try {
      const report = await this.reportModel.findOne({
        where: { id: reportId },
        attributes: ['id', 'type', 'contactEmail', 'companyAdminEmail'],
      })

      if (!report) {
        this.logger.warn(
          `Denied report ${reportId} vanished before its notification could be sent`,
          { context: LOGGING_CONTEXT },
        )
        return
      }

      await this.mailService.sendReportDenied(report, denialReason)
    } catch (error) {
      this.logger.error(
        `Failed to notify company of denial for report ${reportId}`,
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  /**
   * Best-effort outbound notification to the island.is application system that
   * a report's review concluded. Only island.is-sourced reports have an
   * application to update — Excel-imported / system reports are skipped.
   *
   * The local status change is already committed and event-logged at this
   * point; a failed outbound call must NOT surface as an error to the admin
   * (the approval/denial stands). We log and move on. A retry/outbox mechanism
   * can be layered on later if eventual consistency proves insufficient.
   */
  private async notifyApplicationSystem(
    reportId: string,
    status: ReportStatusEnum.APPROVED | ReportStatusEnum.DENIED,
  ): Promise<void> {
    try {
      // ⚠️ Inside the try, deliberately. This load used to sit outside it, so a
      // DB error here became a 500 — which, before `runAfterCommit`, rolled the
      // decision back after the company had already been emailed. It now runs
      // post-commit inside an after-commit hook, where a throw would instead
      // become an unhandled rejection. Either way it belongs in the catch.
      const report = await this.reportModel.findOne({
        where: { id: reportId },
        attributes: ['providerType', 'providerId'],
      })

      if (
        report?.providerType !== ReportProviderEnum.ISLAND_IS ||
        !report.providerId
      ) {
        return
      }

      if (status === ReportStatusEnum.APPROVED) {
        await this.applicationSystemService.notifyApproved(report.providerId)
      } else {
        await this.applicationSystemService.notifyDenied(report.providerId)
      }
    } catch (error) {
      // `applicationId` is gone from the meta: `report` is scoped to the try
      // now, and the load itself is one of the things that can fail. The report
      // id in the message is enough to find the application.
      this.logger.error(
        `Failed to notify application system for report ${reportId} (${status})`,
        {
          context: LOGGING_CONTEXT,
          message: error instanceof Error ? error.message : String(error),
        },
      )
    }
  }

  /**
   * Belt-and-suspenders gate: a SALARY report with an outlier group whose
   * explanation has not been filled in (i.e. was submitted with
   * `outliersPostponed = true` and the applicant has not resolved it via the
   * outliers edit endpoint) cannot be approved. EQUALITY reports have no
   * outlier groups, so the query is a cheap no-op for them.
   *
   * The explanation lives on the outlier group, and the group's columns are
   * all-or-none, so "unresolved" means a group with a null `reason` (postponed
   * default group, not yet filled). This enforces the lifecycle invariant:
   * status can leave POSTPONED only after every group has a complete
   * explanation.
   */
  private async assertOutlierExplanationsResolved(
    reportId: string,
  ): Promise<void> {
    const unresolved = await this.reportOutlierGroupModel.findOne({
      where: { reportId, reason: null },
      attributes: ['id'],
    })

    if (unresolved) {
      throw new BadRequestException(
        `Cannot approve report ${reportId}: outlier explanations are still pending`,
      )
    }
  }

  /**
   * Mirror an approved report's `validUntil` onto its parent company's
   * next-due column (`next_salary_report_due_at` for SALARY,
   * `next_equality_report_due_at` for EQUALITY). The "due" date a company is
   * measured against is the validity end of its current report, so the two are
   * kept identical here. Subsidiaries carry no obligation of their own; only the
   * parent (`parentCompanyId IS NULL`) snapshot is updated.
   */
  private async advanceCompanyReportDueDate(
    reportId: string,
    validUntil: Date,
  ): Promise<void> {
    const report = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['type'],
    })

    if (!report) {
      return
    }

    const parentSnapshot = await this.companyReportModel.findOne({
      where: { reportId, parentCompanyId: null },
      attributes: ['companyId'],
    })

    if (!parentSnapshot) {
      return
    }

    const column =
      report.type === ReportTypeEnum.SALARY
        ? { nextSalaryReportDueAt: validUntil }
        : { nextEqualityReportDueAt: validUntil }

    await this.companyModel.update(column, {
      where: { id: parentSnapshot.companyId },
    })
  }

  private async supersedePreviousApproved(reportId: string): Promise<void> {
    // Supersession is scoped to `(company, type)` — approving a new SALARY
    // must not invalidate a still-valid APPROVED EQUALITY (and vice versa).
    // See db/README.md → "Report lifecycle" / SUPERSEDED.
    const newReport = await this.reportModel.findOne({
      where: { id: reportId },
      attributes: ['type'],
    })

    if (!newReport) {
      return
    }

    const newReportType: ReportTypeEnum = newReport.type

    const companyReport = await this.companyReportModel.findOne({
      where: { reportId },
      attributes: ['companyId'],
    })

    if (!companyReport) {
      return
    }

    const siblingReportIds = (
      await this.companyReportModel.findAll({
        where: { companyId: companyReport.companyId },
        attributes: ['reportId'],
      })
    )
      .map((cr) => cr.reportId)
      .filter((id) => id !== reportId)

    if (siblingReportIds.length === 0) {
      return
    }

    const toSupersede = await this.reportModel.findAll({
      where: {
        id: siblingReportIds,
        status: ReportStatusEnum.APPROVED,
        type: newReportType,
      },
      attributes: ['id'],
    })

    if (toSupersede.length === 0) {
      return
    }

    // Close out the old report's validity at "now". Deliberately does NOT touch
    // the company's next-due date — that was already advanced to the new
    // report's validUntil in approve(); the superseded report is no longer the
    // company's current obligation.
    await this.reportModel.update(
      { status: ReportStatusEnum.SUPERSEDED, validUntil: new Date() },
      { where: { id: toSupersede.map((r) => r.id) } },
    )

    for (const report of toSupersede) {
      await this.reportEventService.emitSuperseded(report.id, reportId)
    }
  }
}
