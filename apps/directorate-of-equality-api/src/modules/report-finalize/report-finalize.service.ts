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
import { AUTO_REVIEW_ENFORCE } from '../report-auto-review/report-auto-review.constants'
import { IReportAutoReviewService } from '../report-auto-review/report-auto-review.service.interface'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'
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
  ) {}

  /**
   * Schema invariant: a SALARY row's `equality_report_id` must point to an
   * EQUALITY row that was APPROVED at the moment of insert and is still
   * within its three-year validity window.
   */
  async assertEqualityReportApproved(equalityReportId: string): Promise<void> {
    const equalityReport = await this.reportModel.findOne({
      where: {
        id: equalityReportId,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        validUntil: { [Op.gt]: new Date() },
      },
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
   * - IN_REVIEW or POSTPONED → reject with 409. The reviewer (or the
   *   postponement-resolution flow) is mid-workflow on the prior report and
   *   it cannot be discarded silently.
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

    const blocking = siblings.find(
      (sibling) =>
        sibling.status === ReportStatusEnum.IN_REVIEW ||
        sibling.status === ReportStatusEnum.POSTPONED,
    )
    if (blocking) {
      throw new ConflictException(
        `Company already has a ${type} report in status ${blocking.status} (providerId: ${blocking.providerId ?? 'n/a'}). Resolve it before submitting another.`,
      )
    }

    const withdrawnIds = siblings.map((sibling) => sibling.id)
    await this.reportModel.update(
      { status: ReportStatusEnum.WITHDRAWN },
      { where: { id: withdrawnIds } },
    )

    this.logger.info(
      `Withdrew ${withdrawnIds.length} SUBMITTED ${type} report(s) for company ${companyId}`,
      { context: LOGGING_CONTEXT, withdrawnIds },
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
