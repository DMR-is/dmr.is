import { Op } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  AutoReviewDecisionEnum,
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { IReportService } from '../report/report.service.interface'
import { EqualityCoverage } from '../report/types/equality-coverage'
import { AUTO_REVIEW_ENFORCE } from '../report-auto-review/report-auto-review.constants'
import { IReportAutoReviewService } from '../report-auto-review/report-auto-review.service.interface'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'
import { WithdrawInflightSiblingOptions } from './report-finalize.service.interface'
import { IReportFinalizeService } from './report-finalize.service.interface'

const LOGGING_CONTEXT = 'ReportFinalizeService'

@Injectable()
export class ReportFinalizeService implements IReportFinalizeService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
    @Inject(IReportAutoReviewService)
    private readonly autoReviewService: IReportAutoReviewService,
    @Inject(IReportService)
    private readonly reportService: IReportService,
  ) {}

  /**
   * What a new salary submission will be filed against, for a caller that does
   * not name it — every partner-API submission, since that contract omits the
   * field, and every island.is submission from a company whose coverage has no
   * id to name.
   *
   * Lives beside `assertEqualityReportApproved` and is called from the same
   * place, which is the point: this must run **after** the idempotent replay
   * check, never before it. Resolving first made a retry of an
   * already-filed report answer 404 once its equality report stopped being
   * active, instead of replaying — a report that was successfully filed
   * becoming un-retryable because a precondition for NEW submissions had since
   * lapsed.
   *
   * **Delegates rather than querying**, and that is the whole point. This
   * resolution has to select exactly what `GET /reports/salary/eligibility` and
   * `GET /reports/equality/active` already told the caller, because those two
   * are the pre-check for this submission. It once filtered
   * `parentCompanyId: null` — equality reports the company filed as the parent
   * — while both of those routes join on `companyId` alone and so also match a
   * subsidiary. A company covered by a group equality report therefore read
   * `eligible: true`, received a real report id, submitted, and was refused;
   * and since the partner contract no longer carries `equalityReportId`, it had
   * no field left to override the answer with. It could not file at all.
   *
   * Sharing the lookup is what keeps the pre-check and the submission from ever
   * disagreeing again. It also collapses two round trips into one indexed join.
   * `resolveEqualityCoverage` is now that shared lookup, and it answers with a
   * legacy certificate as readily as with a report — which is the same class of
   * bug caught a second time, and at far greater scale: the ~540 companies
   * whose equality plan exists only on the retired register were told by both
   * read routes that they had none, and could file no salary report at all.
   */
  async resolveEqualityCoverage(companyId: string): Promise<EqualityCoverage> {
    const coverage = await this.reportService.resolveEqualityCoverage(companyId)

    if (!coverage) {
      // The same sentence `GET .../reports/equality/active` answers with, so a
      // caller that skipped the eligibility pre-check reads one message from
      // either route.
      throw new NotFoundException('No approved equality report is in force')
    }

    return coverage
  }

  /**
   * Schema invariant: a SALARY row's `equality_report_id` must point to an
   * EQUALITY row that was APPROVED at the moment of insert, is still within
   * its three-year validity window — and covers the submitting company.
   *
   * The last clause is authorization, not schema. The id is the applicant's,
   * and without the join a company with no equality plan of its own could file
   * a salary report against any other company's approved plan: the borrowed
   * identifier, `approvedAt` and `validUntil` then read back on
   * `GET /application/reports/:providerId`, and approving the salary report
   * moved the company's next due date out three years. Reachable from the
   * partner API as well as island.is (Claude Security F8).
   *
   * Joins on `companyId` alone, NOT `parentCompanyId: null`, so that this
   * selects exactly what `findActiveEqualityForCompany` selects for the
   * eligibility and active-report routes and for `resolveEqualityCoverage`. A
   * subsidiary covered by a group equality report is handed that report's id
   * by those routes and must be allowed to name it back here; filtering to the
   * parent row is the regression `resolveEqualityCoverage` documents above.
   *
   * 404 rather than 403, with the same sentence as for an unknown id: the
   * caller learns nothing about whether the id exists for someone else.
   */
  async assertEqualityReportApproved(
    equalityReportId: string,
    companyId: string,
  ): Promise<void> {
    const equalityReport = await this.reportModel.findOne({
      where: {
        id: equalityReportId,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        validUntil: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: CompanyReportModel,
          as: 'companyReport',
          where: { companyId },
          required: true,
          attributes: [],
        },
      ],
    })

    if (!equalityReport) {
      throw new NotFoundException(
        `No approved EQUALITY report found at id "${equalityReportId}"`,
      )
    }
  }

  /**
   * Pre-insert guard for submissions: a company may not have more than one
   * in-flight report of a given type at the same time. Policy by status of
   * the existing sibling:
   *
   * - SUBMITTED → silently withdraw the prior report. The applicant changed
   *   their mind before any reviewer interaction, so retiring the old row is
   *   safe; the new submission takes its place.
   * - IN_REVIEW → reject with 409. A reviewer is mid-workflow on the prior
   *   report and it cannot be discarded silently.
   * - POSTPONED → 409 by default, for the same reason: the applicant chose to
   *   defer and the resolution flow is mid-workflow. A caller for whom
   *   POSTPONED is simply what a submission *becomes* can pass
   *   `withdrawPostponed` and have it withdrawn instead — and only then, and
   *   only for a sibling filed on its own channel. See
   *   `WithdrawInflightSiblingOptions`.
   *
   * Returns the ids of any reports that were withdrawn so the caller can
   * emit one WITHDRAWN event per retiree linked to the new replacing report.
   *
   * Concurrency: the helper takes an exclusive row-lock on the company row
   * before checking siblings, serialising concurrent submits for the same
   * company. Without this lock, two simultaneous submits could each observe
   * no in-flight sibling (or the same SUBMITTED predecessor) and both
   * proceed to insert, leaving two SUBMITTED reports behind.
   */
  async withdrawInflightSibling(
    companyId: string,
    type: ReportTypeEnum,
    options: WithdrawInflightSiblingOptions = {},
  ): Promise<string[]> {
    await this.companyModel.findOne({
      where: { id: companyId },
      attributes: ['id'],
      lock: true,
    })

    const inflightStatuses = [
      ReportStatusEnum.SUBMITTED,
      ReportStatusEnum.IN_REVIEW,
      ReportStatusEnum.POSTPONED,
    ]

    // Pinned to `parentCompanyId: null` — reports this company filed itself.
    // A subsidiary also has a snapshot row on its parent's group report, and
    // without the pin that row would resolve to the PARENT's report: a
    // subsidiary's own submission would then withdraw a SUBMITTED parent
    // report, or 409 against an IN_REVIEW one and leak its providerId. This
    // is the opposite choice from `assertEqualityReportApproved`, which joins
    // on `companyId` alone on purpose: coverage flows down a group, ownership
    // of an in-flight filing does not.
    const parentSnapshots = await this.companyReportModel.findAll({
      where: { companyId, parentCompanyId: null },
      attributes: ['reportId'],
    })

    if (parentSnapshots.length === 0) {
      return []
    }

    const candidateIds = parentSnapshots.map((row) => row.reportId)

    const siblings = await this.reportModel.findAll({
      where: {
        id: { [Op.in]: candidateIds },
        type,
        status: { [Op.in]: inflightStatuses },
      },
    })

    if (siblings.length === 0) {
      return []
    }

    // `IN_REVIEW` always collides: a reviewer is mid-workflow on that report, so
    // withdrawing it out from under them is a different act from replacing
    // something nobody has picked up. `POSTPONED` collides by default for the
    // same reason it exists — the applicant chose to defer and should finish —
    // but a caller for whom `POSTPONED` is simply what a submission with
    // outliers becomes can ask for it to be replaced instead. See
    // `CreateReportDto.withdrawPostponedSibling`.
    // `withdrawPostponed` is the caller saying "on my channel, POSTPONED is what
    // a submission becomes". That is only true of siblings filed on the same
    // channel: an applicant who deliberately deferred on island.is has not asked
    // for their report to be retired by their vendor's next filing, and would
    // get no signal if it were — they cannot see the vendor's report and the
    // `409` that used to name theirs would be gone.
    const replaceable = (sibling: ReportModel) =>
      options.withdrawPostponed &&
      (options.providerType === undefined ||
        sibling.providerType === options.providerType)

    const blocking = siblings.find(
      (sibling) =>
        sibling.status === ReportStatusEnum.IN_REVIEW ||
        (sibling.status === ReportStatusEnum.POSTPONED &&
          !replaceable(sibling)),
    )
    if (blocking) {
      throw new ConflictException(
        `Company already has a ${type} report in status ${
          blocking.status
        } (providerId: ${
          blocking.providerId ?? 'n/a'
        }). Resolve it before submitting another.`,
      )
    }

    const withdrawnIds = siblings.map((sibling) => sibling.id)
    await this.reportModel.update(
      { status: ReportStatusEnum.WITHDRAWN },
      { where: { id: withdrawnIds } },
    )

    this.logger.info(
      `Withdrew ${withdrawnIds.length} in-flight ${type} report(s) for company ${companyId}`,
      {
        context: LOGGING_CONTEXT,
        withdrawnIds,
        statuses: siblings.map((sibling) => sibling.status),
      },
    )

    return withdrawnIds
  }

  async emitWithdrawnEvents(
    withdrawnReportIds: string[],
    replacingReportId: string,
  ): Promise<void> {
    for (const withdrawnId of withdrawnReportIds) {
      await this.reportEventModel.create({
        reportId: withdrawnId,
        eventType: ReportEventTypeEnum.WITHDRAWN,
        reportStatus: ReportStatusEnum.WITHDRAWN,
        actorUserId: null,
        relatedReportId: replacingReportId,
      })
    }
  }

  async createCompanyReportSnapshots(
    reportId: string,
    companies: CreateReportCompanySnapshotDto[],
  ): Promise<void> {
    const companyIds = [
      ...new Set(companies.map((company) => company.companyId)),
    ]
    const companyRows = await this.companyModel.findAll({
      where: { id: { [Op.in]: companyIds } },
    })
    const companyById = new Map(
      companyRows.map((company) => [company.id, company]),
    )

    for (const companyId of companyIds) {
      if (!companyById.has(companyId)) {
        throw new BadRequestException(`Company "${companyId}" not found`)
      }
    }

    await this.companyReportModel.bulkCreate(
      companies.map((company) => {
        const stored = companyById.get(company.companyId)
        // Guaranteed present by the validation loop above; checked again
        // here purely to narrow the type for the compiler.
        if (!stored) {
          throw new BadRequestException(
            `Company "${company.companyId}" not found`,
          )
        }
        return {
          companyId: company.companyId,
          reportId,
          parentCompanyId: company.parentCompanyId,
          name: company.name,
          nationalId: company.nationalId,
          address: company.address,
          city: company.city,
          postcode: company.postcode,
          employeeCountCategory: stored.employeeCountCategory,
          isatCategory: company.isatCategory,
        }
      }),
    )
  }

  /**
   * Soft auto-review: ask the system what it *would* decide and record the
   * verdict as a SYSTEM_AUTO_REVIEW event (actorUserId null — no human actor).
   * The report's status is never changed here. The `AUTO_REVIEW_ENFORCE` branch
   * is the single seam to flip when the directorate moves from soft audit to
   * real automation; until then it stays dark.
   */
  async recordAutoReview(
    reportId: string,
    reportStatus: ReportStatusEnum,
    companyId: string,
  ): Promise<void> {
    const verdict = await this.autoReviewService.evaluate(reportId)

    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.SYSTEM_AUTO_REVIEW,
      reportStatus,
      actorUserId: null,
      reason: verdict.reason,
      systemDecision: verdict.decision,
      companyId,
    })

    this.logger.info(
      `Auto-review verdict ${verdict.decision} for report ${reportId}`,
      { context: LOGGING_CONTEXT, reportId, decision: verdict.decision },
    )

    if (
      AUTO_REVIEW_ENFORCE &&
      verdict.decision === AutoReviewDecisionEnum.AUTO_APPROVE
    ) {
      // TODO: enforcement path — transition the report to APPROVED via a
      // system actor (extract the side-effect core of
      // ReportWorkflowService.approve so a null-actor path can call it).
      this.logger.info(
        `AUTO_REVIEW_ENFORCE on — would auto-approve report ${reportId}`,
        { context: LOGGING_CONTEXT, reportId },
      )
    }
  }

  /**
   * SUBMITTED audit event — actorUserId null = company admin. reportStatus
   * snapshots the actual landing status so the event log captures whether
   * outliers were postponed at submit time.
   */
  async emitSubmittedEvent(
    reportId: string,
    reportStatus: ReportStatusEnum,
    companyId: string,
  ): Promise<void> {
    await this.reportEventModel.create({
      reportId,
      eventType: ReportEventTypeEnum.SUBMITTED,
      reportStatus,
      actorUserId: null,
      companyId,
    })
  }
}
