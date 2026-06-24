import { Op } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared-dto'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import { DEFAULT_OUTLIER_GROUP_NAME } from '../../core/constants'
import { ICompanyService } from '../company/company.service.interface'
import { CompanyDto } from '../company/dto/company.dto'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import {
  type DetectedOutlier,
  detectOutliers,
  type OutlierDetectionEmployee,
} from '../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../report/lib/employee-scores'
import {
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { IReportService } from '../report/report.service.interface'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { CommentVisibilityEnum } from '../report-comment/models/report-comment.model'
import { IReportCommentService } from '../report-comment/report-comment.service.interface'
import { CreateEqualityReportDto } from '../report-create/dto/create-equality-report.dto'
import {
  CreateReportCompanySnapshotDto,
  CreateReportDto,
} from '../report-create/dto/create-report.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportEventService } from '../report-event/report-event.service.interface'
import type { ReportResultDto } from '../report-result/dto/report-result.dto'
import { IReportResultService } from '../report-result/report-result.service.interface'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from '../report-statistics/lib/build-chart'
import { ApplicationReportCommentDto } from './dto/application-report-comment.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EditEqualityContentDto } from './dto/edit-equality-content.dto'
import { EditOutliersDto } from './dto/edit-outliers.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import {
  SalaryAnalysisOutlierDirectionEnum,
  SalaryAnalysisOutlierDto,
  SalaryAnalysisResponseDto,
} from './dto/salary-analysis.response.dto'
import { SalaryReportEligibilityDto } from './dto/salary-report-eligibility.dto'
import { SubmitApplicationReportCommentDto } from './dto/submit-application-report-comment.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import type {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './dto/submit-report-company.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import { EQUALITY_REPORT_TEMPLATE_BASE64 } from './equality-template/template-data'
import { buildEqualityReportTemplateHtml } from './equality-template/template-html'
import { evaluateSalaryRenewalEligibility } from './lib/salary-renewal-eligibility'
import { IApplicationService } from './application.service.interface'

const LOGGING_CONTEXT = 'ApplicationService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

/**
 * This module is bound to the island.is application portal. Other upstream
 * provider channels — when they exist — get their own controllers; we don't
 * branch within this one.
 */
const APPLICATION_REPORT_PROVIDER = ReportProviderEnum.ISLAND_IS

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IConfigService) private readonly configService: IConfigService,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    @Inject(IReportService) private readonly reportService: IReportService,
    @Inject(IReportCreateService)
    private readonly reportCreateService: IReportCreateService,
    @Inject(IReportCommentService)
    private readonly reportCommentService: IReportCommentService,
    @Inject(IReportEventService)
    private readonly reportEventService: IReportEventService,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportOutlierGroupModel)
    private readonly reportOutlierGroupModel: typeof ReportOutlierGroupModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
  ) {}

  async salaryAnalysis(
    input: SalaryAnalysisRequestDto,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto> {
    this.logger.debug('Running salary analysis on parsed payload', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      employeeCount: input.parsed.employees.length,
    })

    // 1. Integrity-check the parsed payload (rejects malformed input as 400)
    //    and capture the step-score lookup map.
    const stepScoreByKey = assertParsedPayloadIntegrity(input.parsed)

    // 2. Compute per-employee total scores using the same dedup'd Set logic
    //    the submit endpoint uses, so preview and submit agree on score.
    const employeeScores = computeEmployeeScores(input.parsed, stepScoreByKey)

    // 3. Build the detection input — pairs each parsed employee with its
    //    computed score and ordinal so detectOutliers can return outlier
    //    rows referenced by ordinal.
    const detectionEmployees: OutlierDetectionEmployee[] =
      input.parsed.employees.map((employee, index) => ({
        ordinal: employee.ordinal,
        score: employeeScores[index],
        gender: employee.gender,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
      }))

    // 4. Pull the active threshold from config (re-read at submit too — small
    //    drift between preview and submit is acceptable per plan).
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    // 5. Detect outliers using the canonical helper.
    const detected = detectOutliers({
      employees: detectionEmployees,
      thresholdPercent,
    })

    // 6. Build the chart half of the response from the same employee/score
    //    mapping the reviewer-side getBaseSalaryByGenderAndScoreAll uses.
    const chartPoints: EmployeeDataPoint[] = detectionEmployees.map(
      (employee) => ({
        score: employee.score,
        adjustedSalary: employee.baseSalary / employee.workRatio,
        gender: employee.gender,
      }),
    )
    const baseSalaryByGenderAndScoreAll =
      buildChartFromEmployeePoints(chartPoints)

    return {
      outliers: detected.map(toOutlierDto),
      baseSalaryByGenderAndScoreAll,
    }
  }

  async submitSalary(
    input: SubmitSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.logger.info('Submitting salary report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      identifier: input.identifier,
    })

    // Renewal-window gate: a company may only submit a salary report once its
    // current one is due in 6 months or less. Same verdict the eligibility
    // endpoint returns, so the pre-check and this block cannot drift. Only the
    // company-facing portal path is gated — admin/system creation is not.
    const eligibility = this.getSalaryReportEligibility(company)
    if (!eligibility.eligible) {
      throw new ConflictException(
        `Salary report renewal window is not open yet for company "${company.id}"; earliest submission ${eligibility.earliestSubmissionDate?.toISOString() ?? 'n/a'}`,
      )
    }

    const createInput = await this.createSalaryReportInput(input, company)
    return this.reportCreateService.createSalary(createInput)
  }

  getSalaryReportEligibility(company: CompanyDto): SalaryReportEligibilityDto {
    const { eligible, reason, dueAt, earliestSubmissionDate } =
      evaluateSalaryRenewalEligibility(
        company.nextSalaryReportDueAt ?? null,
        new Date(),
      )

    return { eligible, reason, dueAt, earliestSubmissionDate }
  }

  async submitEquality(
    input: SubmitEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.logger.info('Submitting equality report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      identifier: input.identifier,
    })

    const createInput = await this.createEqualityReportInput(input, company)
    return this.reportCreateService.createEquality(createInput)
  }

  async getActiveEqualityReport(
    company: CompanyDto,
  ): Promise<EqualityReportSummaryDto> {
    const equality = await this.reportService.getActiveEqualityForCompany(
      company.id,
    )

    if (!equality) {
      throw new NotFoundException(
        `No active equality report found for company "${company.id}"`,
      )
    }

    return equality
  }

  getEqualityTemplateHtml(): string {
    return buildEqualityReportTemplateHtml()
  }

  getEqualityTemplateDocx(): Buffer {
    return Buffer.from(EQUALITY_REPORT_TEMPLATE_BASE64, 'base64')
  }

  async getReport(
    providerId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    const report = await this.reportModel.findOne({
      where: { providerType: APPLICATION_REPORT_PROVIDER, providerId },
    })

    if (!report) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    const companyRows = await this.companyReportModel.findAll({
      where: { reportId: report.id },
      order: [['createdAt', 'ASC']],
    })

    const parentCompany = companyRows.find(
      (row) => row.parentCompanyId === null,
    )
    if (!parentCompany || parentCompany.companyId !== company.id) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    const [equalityReport, salaryData, externalComments, denialReason] =
      await Promise.all([
        this.loadLinkedEqualityReport(report),
        this.loadSalaryData(report),
        this.reportCommentService.getByReportId(
          this.createCompanyReportContext(report, company),
        ),
        this.loadDenialReason(report),
      ])

    return {
      id: report.id,
      type: report.type,
      status: report.status,
      identifier: report.identifier,
      submittedAt: report.createdAt ?? null,
      approvedAt: report.approvedAt,
      validUntil: report.validUntil,
      correctionDeadline: report.correctionDeadline,
      companies: companyRows.map((row) => CompanyReportModel.fromModel(row)),
      equalityReport,
      equalityReportContent:
        report.type === ReportTypeEnum.EQUALITY
          ? report.equalityReportContent
          : null,
      outliersPostponed:
        report.type === ReportTypeEnum.SALARY
          ? report.status === ReportStatusEnum.POSTPONED
          : null,
      includesImprovementPlan: salaryData.includesImprovementPlan,
      result: salaryData.result,
      externalComments: externalComments.map(
        ApplicationReportCommentDto.fromReportComment,
      ),
      denialReason,
    }
  }

  async createReportComment(
    providerId: string,
    input: SubmitApplicationReportCommentDto,
    company: CompanyDto,
  ): Promise<ApplicationReportCommentDto> {
    this.logger.info('Submitting report comment from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      providerId,
    })

    const report = await this.reportModel.findOne({
      where: { providerType: APPLICATION_REPORT_PROVIDER, providerId },
    })

    if (!report) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    const companyRows = await this.companyReportModel.findAll({
      where: { reportId: report.id },
      order: [['createdAt', 'ASC']],
    })

    const parentCompany = companyRows.find(
      (row) => row.parentCompanyId === null,
    )
    if (!parentCompany || parentCompany.companyId !== company.id) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    const created = await this.reportCommentService.create(
      this.createCompanyReportContext(report, company),
      {
        body: input.body,
        visibility: CommentVisibilityEnum.EXTERNAL,
      },
    )

    return ApplicationReportCommentDto.fromReportComment(created)
  }

  /**
   * In-place edit of an EQUALITY report's narrative body. Allowed only on
   * `IN_REVIEW` reports — i.e. a reviewer has picked the report up and asked
   * for changes via comment. Status is preserved (reviewer keeps their
   * pickup); the EDITED event is the audit signal that the applicant
   * responded.
   */
  async editEqualityContent(
    providerId: string,
    input: EditEqualityContentDto,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    this.logger.info('Editing equality content from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      providerId,
    })

    const report = await this.findOwnedReportByProviderTuple(
      providerId,
      company,
    )

    if (report.type !== ReportTypeEnum.EQUALITY) {
      throw new BadRequestException(
        `Cannot edit equality content on a report of type ${report.type}`,
      )
    }

    if (report.status !== ReportStatusEnum.IN_REVIEW) {
      throw new BadRequestException(
        `Cannot edit equality content on a report in status ${report.status}`,
      )
    }

    await this.reportModel.update(
      { equalityReportContent: input.equalityReportContent },
      { where: { id: report.id } },
    )

    await this.reportEventService.emitEdited(
      report.id,
      report.status,
      company.id,
    )

    return this.getReport(providerId, company)
  }

  /**
   * Withdraws the report tied to an island.is application that the applicant
   * has deleted upstream. Applicants may only delete an application before it
   * is approved, so withdrawal is rejected once the report has reached a
   * terminal state (APPROVED / DENIED / SUPERSEDED).
   *
   * Idempotent: the upstream delete callback may be retried, so an
   * already-WITHDRAWN report is a no-op rather than an error.
   *
   * Emits `STATUS_CHANGED` (no actor — the applicant, not a reviewer, drives
   * this) and no related report (cf. `emitWithdrawn`, which is for the
   * superseded-by-sibling case).
   */
  async withdraw(providerId: string, company: CompanyDto): Promise<void> {
    this.logger.info('Withdrawing report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      providerId,
    })

    const report = await this.findOwnedReportByProviderTuple(
      providerId,
      company,
    )

    if (report.status === ReportStatusEnum.WITHDRAWN) {
      return
    }

    const WITHDRAWABLE_STATUSES = [
      ReportStatusEnum.DRAFT,
      ReportStatusEnum.SUBMITTED,
      ReportStatusEnum.POSTPONED,
      ReportStatusEnum.IN_REVIEW,
    ]

    if (!WITHDRAWABLE_STATUSES.includes(report.status)) {
      throw new BadRequestException(
        `Cannot withdraw a report in status ${report.status}`,
      )
    }

    await this.reportModel.update(
      { status: ReportStatusEnum.WITHDRAWN },
      { where: { id: report.id } },
    )

    await this.reportEventService.emitStatusChanged(
      report.id,
      report.status,
      ReportStatusEnum.WITHDRAWN,
    )
  }

  /**
   * In-place edit of a SALARY report's outlier groups (replace-all).
   *
   * Allowed in two statuses:
   *   - `POSTPONED` (primary path): applicant is resolving postponement.
   *     Status transitions to `SUBMITTED` on success, emitting both an
   *     `EDITED` and a `STATUS_CHANGED` event.
   *   - `IN_REVIEW` (correction path): reviewer asked for corrections via
   *     comment. Status is preserved; only `EDITED` is emitted.
   *
   * The union of every group's `employeeOrdinals` must match the canonical
   * detected outliers on the report (read from
   * `report_result.outlierAnalysisSnapshot.employees` filtered to
   * `isOutlier = true`) — every detected ordinal covered exactly once, no
   * extras, no missing, no ordinal in two groups. The report's existing groups
   * are replaced wholesale: the outlier rows are re-pointed at freshly created
   * groups and the old groups are deleted.
   */
  async editOutliers(
    providerId: string,
    input: EditOutliersDto,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    this.logger.info('Editing outliers from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      providerId,
    })

    const report = await this.findOwnedReportByProviderTuple(
      providerId,
      company,
    )

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        `Cannot edit outliers on a report of type ${report.type}`,
      )
    }

    if (
      report.status !== ReportStatusEnum.POSTPONED &&
      report.status !== ReportStatusEnum.IN_REVIEW
    ) {
      throw new BadRequestException(
        `Cannot edit outliers on a report in status ${report.status}`,
      )
    }

    // 1. Pure request validation — flatten the groups into a single ordinal
    //    set, rejecting any ordinal that appears in more than one group (an
    //    outlier belongs to exactly one group). Failing fast keeps the error
    //    message specific to the input and avoids unnecessary work.
    const submittedOrdinals = new Set<number>()
    for (const group of input.groups) {
      for (const ordinal of group.employeeOrdinals) {
        if (submittedOrdinals.has(ordinal)) {
          throw new BadRequestException(
            `Employee ordinal ${ordinal} appears in more than one outlier group`,
          )
        }
        submittedOrdinals.add(ordinal)
      }
    }

    // 2. Canonical detected set, frozen at submit time on the report_result.
    const reportResult = await this.reportResultService.getByReportId(report.id)
    const detectedOrdinals = new Set(
      reportResult.outlierAnalysis.employees
        .filter((employee) => employee.isOutlier)
        .map((employee) => employee.ordinal),
    )

    const extras = [...submittedOrdinals].filter(
      (ordinal) => !detectedOrdinals.has(ordinal),
    )
    if (extras.length > 0) {
      throw new BadRequestException(
        `Outlier group(s) reference non-outlier employee ordinal(s): ${extras.join(', ')}`,
      )
    }

    const missing = [...detectedOrdinals].filter(
      (ordinal) => !submittedOrdinals.has(ordinal),
    )
    if (missing.length > 0) {
      throw new BadRequestException(
        `Detected outlier(s) missing from the outlier groups for employee ordinal(s): ${missing.join(', ')}`,
      )
    }

    // 3. Load the existing outlier rows joined with their employees so we
    //    can resolve ordinal → outlier row id.
    const outlierRows = await this.reportEmployeeOutlierModel.findAll({
      include: [
        {
          model: ReportEmployeeModel,
          as: 'reportEmployee',
          where: { reportId: report.id },
          required: true,
          attributes: ['id', 'ordinal'],
        },
      ],
    })
    const outlierByOrdinal = new Map<number, ReportEmployeeOutlierModel>()
    for (const row of outlierRows) {
      if (row.reportEmployee) {
        outlierByOrdinal.set(row.reportEmployee.ordinal, row)
      }
    }

    // 4. Replace-all. Capture the report's current groups, create the new
    //    ones, re-point each outlier row at its new group, then delete the
    //    old groups (now unreferenced — group_id is NOT NULL, so the
    //    re-point must happen before the delete).
    const previousGroups = await this.reportOutlierGroupModel.findAll({
      where: { reportId: report.id },
      attributes: ['id'],
    })

    for (const group of input.groups) {
      const groupRow = await this.reportOutlierGroupModel.create({
        reportId: report.id,
        name: group.name?.trim() || DEFAULT_OUTLIER_GROUP_NAME,
        reason: group.reason,
        action: group.action,
        signatureName: group.signatureName,
        signatureRole: group.signatureRole,
      })

      for (const ordinal of group.employeeOrdinals) {
        const row = outlierByOrdinal.get(ordinal)
        if (!row) {
          // Shouldn't happen — detected set is read from report_result which
          // is built from the same employees that have outlier rows. Defensive.
          throw new InternalServerErrorException(
            `Outlier row missing for detected employee ordinal ${ordinal}`,
          )
        }
        await this.reportEmployeeOutlierModel.update(
          { groupId: groupRow.id },
          { where: { id: row.id } },
        )
      }
    }

    if (previousGroups.length > 0) {
      await this.reportOutlierGroupModel.destroy({
        where: { id: previousGroups.map((group) => group.id) },
      })
    }

    // 5. If we were resolving postponement, transition POSTPONED → SUBMITTED.
    const wasPostponed = report.status === ReportStatusEnum.POSTPONED
    const newStatus = wasPostponed
      ? ReportStatusEnum.SUBMITTED
      : report.status

    if (wasPostponed) {
      await this.reportModel.update(
        { status: ReportStatusEnum.SUBMITTED },
        { where: { id: report.id } },
      )
      await this.reportEventService.emitStatusChanged(
        report.id,
        ReportStatusEnum.POSTPONED,
        ReportStatusEnum.SUBMITTED,
        null,
      )
    }

    await this.reportEventService.emitEdited(report.id, newStatus, company.id)

    return this.getReport(providerId, company)
  }

  /**
   * Lookup helper used by applicant-facing edit endpoints. Resolves the report
   * by the upstream `(provider_type, provider_id)` tuple and verifies the
   * authenticated company owns the parent `company_report` row. Throws
   * `NotFoundException` on miss or ownership mismatch — never leaks the
   * existence of another company's report.
   */
  private async findOwnedReportByProviderTuple(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportModel> {
    const report = await this.reportModel.findOne({
      where: { providerType: APPLICATION_REPORT_PROVIDER, providerId },
    })

    if (!report) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    const companyRows = await this.companyReportModel.findAll({
      where: { reportId: report.id },
      attributes: ['companyId', 'parentCompanyId'],
    })
    const parentCompany = companyRows.find(
      (row) => row.parentCompanyId === null,
    )
    if (!parentCompany || parentCompany.companyId !== company.id) {
      throw new NotFoundException(`Report "${providerId}" not found`)
    }

    return report
  }

  private async createSalaryReportInput(
    input: SubmitSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportDto> {
    const companies = await this.createReportCompanySnapshots(input, company)

    return {
      equalityReportId: input.equalityReportId,
      identifier: input.identifier,
      importedFromExcel: input.importedFromExcel,
      providerType: APPLICATION_REPORT_PROVIDER,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      averageEmployeeMaleCount: input.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: input.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: input.averageEmployeeNeutralCount,
      parsed: input.parsed,
      companies,
      outliersPostponed: input.outliersPostponed,
      outlierGroups: input.outlierGroups,
    }
  }

  private async createEqualityReportInput(
    input: SubmitEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateEqualityReportDto> {
    const companies = await this.createReportCompanySnapshots(input, company)

    return {
      identifier: input.identifier,
      providerType: APPLICATION_REPORT_PROVIDER,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      equalityReportContent: input.equalityReportContent,
      companies,
    }
  }

  private async createReportCompanySnapshots(
    input: {
      company: SubmitReportCompanyDto
      subsidiaries?: SubmitReportSubsidiaryDto[]
    },
    company: CompanyDto,
  ): Promise<CreateReportCompanySnapshotDto[]> {
    const parentNationalId = input.company.nationalId.trim()

    if (parentNationalId !== company.nationalId) {
      throw new BadRequestException(
        'Submitted parent company does not match the authenticated company',
      )
    }

    const subsidiaries = (input.subsidiaries ?? []).map((subsidiary) => ({
      name: subsidiary.name,
      nationalId: subsidiary.nationalId.trim(),
    }))

    const seenNationalIds = new Set([parentNationalId])
    for (const subsidiary of subsidiaries) {
      if (subsidiary.nationalId === parentNationalId) {
        throw new BadRequestException(
          `Subsidiary company "${subsidiary.nationalId}" cannot be the authenticated parent company`,
        )
      }

      if (seenNationalIds.has(subsidiary.nationalId)) {
        throw new BadRequestException(
          `Duplicate company national id "${subsidiary.nationalId}" in subsidiaries[]`,
        )
      }

      seenNationalIds.add(subsidiary.nationalId)
    }

    const subsidiarySnapshots = await Promise.all(
      subsidiaries.map(async (subsidiary) => {
        const source =
          await this.companyService.getOrCreateSubsidiaryReportSnapshotSource(
            subsidiary,
          )

        return {
          ...source,
          parentCompanyId: company.id,
        }
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

  private async getSalaryDifferenceThresholdPercent(): Promise<number> {
    const config = await this.configService.getByKey(
      SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
    )
    const parsed = parseFloat(config.value)

    if (!Number.isFinite(parsed)) {
      throw new InternalServerErrorException(
        `Config entry "${SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY}" must be numeric`,
      )
    }

    return parsed
  }

  private createCompanyReportContext(
    report: ReportModel,
    company: CompanyDto,
  ): ReportResourceContext {
    return {
      reportId: report.id,
      reportStatus: report.status,
      actor: {
        kind: ReportRoleEnum.COMPANY,
        nationalId: company.nationalId,
      },
    }
  }

  private async loadSalaryData(report: ReportModel): Promise<{
    result: ReportResultDto | null
    includesImprovementPlan: boolean
  }> {
    if (report.type !== ReportTypeEnum.SALARY) {
      return { result: null, includesImprovementPlan: false }
    }

    // Outlier rows themselves are served by the paginated
    // `GET /application/reports/:providerId/outliers` endpoint — the detail
    // view only needs the boolean indicator.
    const [result, outlierCount] = await Promise.all([
      this.getReportResultOrNull(report.id),
      this.reportEmployeeOutlierModel.count({
        include: [
          {
            model: ReportEmployeeModel,
            as: 'reportEmployee',
            attributes: [],
            where: { reportId: report.id },
            required: true,
          },
        ],
      }),
    ])

    return {
      result,
      includesImprovementPlan: outlierCount > 0,
    }
  }

  async getReportOutliers(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto> {
    this.logger.debug('Listing report outliers from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      providerId,
    })

    const report = await this.findOwnedReportByProviderTuple(
      providerId,
      company,
    )

    const { limit, offset } = getLimitAndOffset(query)

    const [result, { rows, count }] = await Promise.all([
      this.getReportResultOrNull(report.id),
      this.reportEmployeeOutlierModel.findAndCountAll({
        include: [
          {
            model: ReportEmployeeModel,
            as: 'reportEmployee',
            attributes: ['id', 'ordinal', 'gender'],
            where: { reportId: report.id },
            required: true,
            include: [
              {
                model: ReportEmployeeRoleModel,
                as: 'role',
                attributes: ['id', 'title'],
                required: false,
              },
            ],
          },
          {
            model: ReportOutlierGroupModel,
            as: 'group',
            attributes: [
              'id',
              'name',
              'reason',
              'action',
              'signatureName',
              'signatureRole',
            ],
            required: true,
          },
        ],
        order: [
          [{ model: ReportEmployeeModel, as: 'reportEmployee' }, 'ordinal', 'ASC'],
        ],
        limit,
        offset,
        distinct: true,
        subQuery: false,
      }),
    ])

    const analysisByOrdinal = new Map(
      result?.outlierAnalysis.employees.map((employee) => [
        employee.ordinal,
        employee,
      ]) ?? [],
    )

    const outliers = rows.map((row) =>
      ReportEmployeeOutlierModel.fromModel(
        row,
        row.reportEmployee
          ? analysisByOrdinal.get(row.reportEmployee.ordinal) ?? null
          : null,
      ),
    )

    const paging = generatePaging(outliers, query.page, query.pageSize, count)

    return { outliers, paging }
  }

  private async getReportResultOrNull(
    reportId: string,
  ): Promise<ReportResultDto | null> {
    try {
      return await this.reportResultService.getByReportId(reportId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null
      }
      throw error
    }
  }

  private async loadLinkedEqualityReport(
    report: ReportModel,
  ): Promise<EqualityReportSummaryDto | null> {
    if (report.type !== ReportTypeEnum.SALARY || !report.equalityReportId) {
      return null
    }

    const equalityReport = await this.reportModel.findOne({
      where: {
        id: report.equalityReportId,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        validUntil: { [Op.gt]: new Date() },
      },
    })

    if (!equalityReport) {
      return null
    }

    return {
      id: equalityReport.id,
      identifier: equalityReport.identifier,
      approvedAt: equalityReport.approvedAt,
      validUntil: equalityReport.validUntil,
    }
  }

  private async loadDenialReason(report: ReportModel): Promise<string | null> {
    if (report.status !== ReportStatusEnum.DENIED) {
      return null
    }

    // The event stream itself stays reviewer-facing, but a denied company needs
    // the latest denial reason to correct its submission.
    const deniedEvent = await this.reportEventModel.findOne({
      where: {
        reportId: report.id,
        eventType: ReportEventTypeEnum.STATUS_CHANGED,
        toStatus: ReportStatusEnum.DENIED,
      },
      order: [['createdAt', 'DESC']],
    })

    return deniedEvent?.reason ?? null
  }
}

function toOutlierDto(detected: DetectedOutlier): SalaryAnalysisOutlierDto {
  // detectOutliers only emits rows where isOutlier=true, which guarantees
  // a non-null direction and non-null differencePercent (see the assessment
  // in compensation-aggregates.ts).
  const { assessment } = detected

  return {
    employeeOrdinal: detected.ordinal,
    adjustedBaseSalary: Math.round(detected.adjustedBaseSalary),
    predictedBaseSalary: Math.round(detected.predictedBaseSalary),
    scoreBucketRangeFrom: detected.scoreBucketRangeFrom,
    scoreBucketRangeTo: detected.scoreBucketRangeTo,
    direction:
      (assessment.direction as SalaryAnalysisOutlierDirectionEnum | null) ??
      SalaryAnalysisOutlierDirectionEnum.EQUAL,
    differencePercent: assessment.differencePercent ?? 0,
    allowedDifferencePercent: assessment.allowedDifferencePercent,
  }
}
