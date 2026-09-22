import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../../company/company.service.interface'
import { CompanyDto } from '../../company/dto/company.dto'
import { DEFAULT_OUTLIER_GROUP_NAME } from '../../constants'
import { rethrowReportWriteError } from '../../report/lib/report-identifier'
import { resolveSalaryDataBasis } from '../../report/lib/salary-data-basis'
import {
  EqualityCoverageSourceEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.model'
import { CreateReportCompanySnapshotDto } from '../../report-create/dto/create-report.dto'
import { CreateReportResponseDto } from '../../report-create/dto/create-report-response.dto'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportFinalizeService } from '../../report-finalize/report-finalize.service.interface'
import { IReportIdentifierService } from '../../report-identifier/report-identifier.service.interface'
import { IReportResultService } from '../../report-result/report-result.service.interface'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { SubmitDraftDto } from './dto/submit-draft.dto'
import { IReportDraftSubmitService } from './report-draft-submit.service.interface'

const LOGGING_CONTEXT = 'ReportDraftSubmitService'

@Injectable()
export class ReportDraftSubmitService implements IReportDraftSubmitService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IReportDraftAnalysisService)
    private readonly analysisService: IReportDraftAnalysisService,
    @Inject(IReportFinalizeService)
    private readonly finalizeService: IReportFinalizeService,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
    @Inject(IReportIdentifierService)
    private readonly reportIdentifierService: IReportIdentifierService,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly outlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly outlierGroupModel: typeof ReportOutlierGroupModel,
  ) {}

  async submitDraft(
    providerId: string,
    company: CompanyDto,
    input: SubmitDraftDto,
  ): Promise<CreateReportResponseDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    const isSalary = report.type === ReportTypeEnum.SALARY

    /*
     * Omitting `equalityReportId` on a salary draft used to be a 400. It is now
     * an instruction to resolve the coverage server-side, exactly as the two
     * other submit paths do — and it has to be, because a company covered by an
     * unexpired certificate from the retired register has no id to send. Those
     * ~540 companies could not submit through this route at all: the field they
     * were told was required names a `report` row the register load never
     * created for them. `resolveEqualityCoverage` 404s when nothing covers the
     * company, which is the honest refusal the 400 was standing in for.
     */
    const coverage =
      isSalary && !input.equalityReportId
        ? await this.finalizeService.resolveEqualityCoverage(company.id)
        : null

    // Outliers are a salary-only concept, so the flag has no meaning on an
    // equality report. Rejecting rather than ignoring: a portal that sends it
    // here believes it is deferring something.
    if (!isSalary && input.outliersPostponed) {
      throw new BadRequestException(
        'outliersPostponed is only valid on a SALARY report',
      )
    }

    // The applicant must have declared what period the salary figures describe:
    // a specific payroll month (and which one) or a twelve-month average. Both
    // arrive during drafting via the header PATCH, which already normalised the
    // pair; the resolved pair is persisted again below so submit does not depend
    // on that having happened. Runs before anything is written, so an
    // undeclared basis fails the whole submit.
    const salaryDataBasis = isSalary ? resolveSalaryDataBasis(report) : null

    // Snapshot company details (frozen at submit) — validate parent matches the
    // authenticated company and resolve subsidiaries.
    const companies = await this.buildCompanySnapshots(input, company)

    const equalityReportId = isSalary
      ? (input.equalityReportId ??
        (coverage?.source === EqualityCoverageSourceEnum.REPORT
          ? coverage.report.id
          : null))
      : null

    if (equalityReportId) {
      // `company` is the authenticated submitter, resolved by `findOwnedDraft`,
      // so an applicant cannot cite another company's equality plan.
      await this.finalizeService.assertEqualityReportApproved(
        equalityReportId,
        company.id,
      )
    }

    // Read off the coverage rather than inferred from `!equalityReportId`, so
    // the basis and the date below come from one fact — see the CHECK in
    // m-20260916, which constrains the three columns together and would reject
    // any row where the two derivations drifted. Coverage is only resolved for
    // a salary report that named none, so an equality draft and a caller-named
    // report both fall to REPORT, which is what each of them is.
    const equalitySource = coverage?.source ?? EqualityCoverageSourceEnum.REPORT

    const equalityLegacyValidUntil =
      coverage?.source === EqualityCoverageSourceEnum.LEGACY
        ? coverage.legacyValidUntil
        : null

    // Retire any still-SUBMITTED sibling of the same type before this one takes
    // its place (409s if a sibling is IN_REVIEW/POSTPONED). The draft has no
    // company_report yet, so it is not seen as its own sibling.
    const withdrawnReportIds =
      await this.finalizeService.withdrawInflightSibling(
        company.id,
        report.type,
      )

    await this.finalizeService.createCompanyReportSnapshots(
      report.id,
      companies,
    )

    let status = ReportStatusEnum.SUBMITTED
    if (isSalary) {
      // Freeze scores, then the result snapshot (which reads them), then decide
      // SUBMITTED vs POSTPONED from the outlier explanation state.
      await this.analysisService.persistScores(report.id)
      await this.reportResultService.createForReport(report.id)
      status = await this.resolveSalaryOutlierStatus(
        report.id,
        input.outliersPostponed ?? false,
      )
    }

    try {
      await report.update({
        status,
        // Minted here rather than at draft-create: the identifier only exists
        // so reviewers can refer to a report without quoting a kennitala, and a
        // DRAFT is invisible to reviewers until this point. Drafts are also
        // reaped, so codes handed out earlier would be spent on nothing.
        identifier: await this.reportIdentifierService.allocate(),
        equalityReportId,
        equalitySource,
        equalityLegacyValidUntil,
        ...(salaryDataBasis ?? {}),
      })
    } catch (error) {
      // A collision on the freshly minted identifier is transient, not a bad
      // request — see `rethrowReportWriteError`.
      rethrowReportWriteError(error)
    }

    await this.finalizeService.emitSubmittedEvent(report.id, status, company.id)
    await this.finalizeService.recordAutoReview(report.id, status, company.id)
    await this.finalizeService.emitWithdrawnEvents(
      withdrawnReportIds,
      report.id,
    )

    this.logger.info(`Submitted draft report "${report.id}" as ${status}`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return { reportId: report.id, replayed: false }
  }

  /**
   * Reconciles the persisted outlier grouping against the freshly-detected
   * outlier set and returns the landing status:
   *  - a membership for an employee who is NOT a detected outlier is dropped
   *    (see `pruneStaleMemberships`);
   *  - every detected outlier must then be assigned to a group (400 otherwise);
   *  - referenced groups must be uniformly explained (→ SUBMITTED) or uniformly
   *    unexplained (→ POSTPONED); a mix is rejected.
   * No detected outliers → SUBMITTED.
   *
   * `outliersPostponed` is the applicant's explicit "defer the explanations"
   * choice. It relaxes the assignment rule — unassigned detected outliers are
   * backfilled into a default group instead of rejected — and the uniformity
   * rule, since an explicit choice leaves nothing to infer from a mixed set. It
   * does NOT force POSTPONED: the status is still read off the resulting explanation
   * state, because POSTPONED cannot be assigned (`ReportWorkflowService.assign`
   * takes SUBMITTED/IN_REVIEW only) and therefore cannot be approved. Parking a
   * fully-explained report there would leave a reviewer no move but denial.
   */
  private async resolveSalaryOutlierStatus(
    reportId: string,
    outliersPostponed: boolean,
  ): Promise<ReportStatusEnum> {
    const detected =
      await this.analysisService.getDetectedOutlierEmployeeIds(reportId)

    const employeeIds = (
      await this.employeeModel.findAll({
        where: { reportId },
        attributes: ['id'],
      })
    ).map((row) => row.id)

    let memberships = await this.pruneStaleMemberships(
      reportId,
      await this.loadOutlierMemberships(employeeIds),
      detected,
    )
    const assignedIds = new Set(memberships.map((m) => m.reportEmployeeId))

    if (outliersPostponed) {
      if (detected.size === 0) {
        throw new BadRequestException(
          'Cannot postpone outlier explanations because this salary report has no detected outliers.',
        )
      }

      const unassigned = [...detected].filter((id) => !assignedIds.has(id))
      if (unassigned.length > 0) {
        await this.createPostponedOutlierGroup(reportId, unassigned)
        memberships = await this.loadOutlierMemberships(employeeIds)
      }

      const groups = await this.loadReferencedGroups(memberships)
      return groups.some((group) => group.reason === null)
        ? ReportStatusEnum.POSTPONED
        : ReportStatusEnum.SUBMITTED
    }

    const missing = [...detected].filter((id) => !assignedIds.has(id))
    if (missing.length > 0) {
      throw new BadRequestException(
        `Every detected outlier must be assigned to an outlier group before submitting (${missing.length} unassigned)`,
      )
    }

    if (detected.size === 0) {
      return ReportStatusEnum.SUBMITTED
    }

    const groups = await this.loadReferencedGroups(memberships)
    const explained = groups.filter((g) => g.reason !== null).length

    if (explained === 0) {
      // All acknowledged, none explained yet → postponed.
      return ReportStatusEnum.POSTPONED
    }
    if (explained === groups.length) {
      return ReportStatusEnum.SUBMITTED
    }
    throw new BadRequestException(
      'Outlier groups must be either all explained (submit) or all unexplained (postpone)',
    )
  }

  /**
   * Drops memberships for employees who are no longer detected outliers, and
   * returns the surviving rows.
   *
   * The applicant groups outliers while drafting, then goes back and edits the
   * data. Because the lágmarksmengi is a property of the SET rather than of the
   * person (see `selectMinimumSet`), that reshuffles who is in it, and a
   * membership recorded before the edit can describe someone who is now out.
   * The applicant cannot clear it themselves — the grouping step no longer
   * shows that employee — so rejecting the submit would be a dead end.
   *
   * Reconciling HERE rather than in `syncDraft` is deliberate: sync is a
   * chunked protocol (`MAX_EMPLOYEE_COMMANDS`), so any single batch may be one
   * chunk of a larger edit and the population it would prune against is
   * half-applied. Submit is the one point where the draft is complete, so it is
   * the only place this delete is safe.
   *
   * A group left empty by the prune is not removed: `loadReferencedGroups`
   * reads groups through the surviving memberships, so an empty one simply
   * drops out of the uniformity check.
   */
  private async pruneStaleMemberships(
    reportId: string,
    memberships: ReportEmployeeOutlierModel[],
    detected: Set<string>,
  ): Promise<ReportEmployeeOutlierModel[]> {
    const stale = memberships.filter((m) => !detected.has(m.reportEmployeeId))
    if (stale.length === 0) {
      return memberships
    }

    const staleEmployeeIds = stale.map((m) => m.reportEmployeeId)
    await this.outlierModel.destroy({
      where: { reportEmployeeId: staleEmployeeIds },
    })

    this.logger.info(
      `Dropped ${stale.length} stale outlier membership(s) while submitting draft "${reportId}"`,
      { context: LOGGING_CONTEXT, reportId, employeeIds: staleEmployeeIds },
    )

    return memberships.filter((m) => detected.has(m.reportEmployeeId))
  }

  /** Outlier-group memberships of the given employees (empty for no employees). */
  private async loadOutlierMemberships(
    employeeIds: string[],
  ): Promise<ReportEmployeeOutlierModel[]> {
    if (employeeIds.length === 0) {
      return []
    }
    return this.outlierModel.findAll({
      where: { reportEmployeeId: employeeIds },
      attributes: ['reportEmployeeId', 'groupId'],
    })
  }

  /** The distinct groups the given memberships point at, with their explanation. */
  private async loadReferencedGroups(
    memberships: ReportEmployeeOutlierModel[],
  ): Promise<ReportOutlierGroupModel[]> {
    const groupIds = [...new Set(memberships.map((m) => m.groupId))]
    if (groupIds.length === 0) {
      return []
    }
    return this.outlierGroupModel.findAll({
      where: { id: groupIds },
      attributes: ['id', 'reason'],
    })
  }

  /**
   * Places the given (detected, still unassigned) outliers in a single default
   * group with an empty explanation. Mirrors the postponed branch of
   * `ReportCreateService`, and is what keeps the invariant the outliers edit
   * endpoint relies on: every detected outlier has a row, and every row points
   * at a group (`group_id` is NOT NULL). Without it a postponed draft would be
   * unresolvable — `ApplicationService.editOutliers` 500s on a detected
   * ordinal that has no outlier row.
   */
  private async createPostponedOutlierGroup(
    reportId: string,
    employeeIds: string[],
  ): Promise<void> {
    const group = await this.outlierGroupModel.create({
      reportId,
      name: DEFAULT_OUTLIER_GROUP_NAME,
      reason: null,
      action: null,
      signatureName: null,
      signatureRole: null,
      remedyDate: null,
    })

    await this.outlierModel.bulkCreate(
      employeeIds.map((employeeId) => ({
        reportEmployeeId: employeeId,
        groupId: group.id,
      })),
    )

    this.logger.info(
      `Postponed outlier explanations for draft report "${reportId}" — ${employeeIds.length} outlier(s) placed in a default group`,
      { context: LOGGING_CONTEXT, reportId },
    )
  }

  /**
   * Builds the company_report snapshot input from the submit payload: the
   * parent's details, its kennitala taken from the authenticated company, plus
   * resolved subsidiaries. Mirrors the application-portal submit mapping.
   */
  private async buildCompanySnapshots(
    input: SubmitDraftDto,
    company: CompanyDto,
  ): Promise<CreateReportCompanySnapshotDto[]> {
    // From the authenticated company, not the payload. `SubmitReportCompanyDto`
    // used to carry it and this method refused any value that did not match —
    // so the only accepted value was the one already in hand. See the DTO.
    const parentNationalId = company.nationalId

    const subsidiaries = (input.subsidiaries ?? []).map((subsidiary) => ({
      name: subsidiary.name,
      nationalId: subsidiary.nationalId.trim(),
    }))

    const seen = new Set([parentNationalId])
    for (const subsidiary of subsidiaries) {
      if (subsidiary.nationalId === parentNationalId) {
        throw new BadRequestException(
          `Subsidiary "${subsidiary.nationalId}" cannot be the authenticated parent company`,
        )
      }
      if (seen.has(subsidiary.nationalId)) {
        throw new BadRequestException(
          `Duplicate subsidiary national id "${subsidiary.nationalId}"`,
        )
      }
      seen.add(subsidiary.nationalId)
    }

    const subsidiarySnapshots = await Promise.all(
      subsidiaries.map(async (subsidiary) => {
        const source =
          await this.companyService.getOrCreateSubsidiaryReportSnapshotSource(
            subsidiary,
          )
        return { ...source, parentCompanyId: company.id }
      }),
    )

    return [
      {
        companyId: company.id,
        parentCompanyId: null,
        name: input.company.name,
        nationalId: parentNationalId,
        address: input.company.address,
        city: input.company.city,
        postcode: input.company.postcode,
        isatCategory: input.company.isatCategory,
      },
      ...subsidiarySnapshots,
    ]
  }
}
