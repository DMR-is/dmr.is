import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../company/dto/company.dto'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import {
  type DetectedOutlier,
  detectOutliers,
  type OutlierDetectionEmployee,
} from '../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
} from '../report/lib/employee-scores'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
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
import { IReportCommentService } from '../report-comment/report-comment.service.interface'
import { CreateEqualityReportDto } from '../report-create/dto/create-equality-report.dto'
import {
  CreateReportCompanySnapshotDto,
  CreateReportDto,
} from '../report-create/dto/create-report.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import type { ReportResultDto } from '../report-result/dto/report-result.dto'
import { IReportResultService } from '../report-result/report-result.service.interface'
import {
  buildChartFromEmployeePoints,
  type EmployeeDataPoint,
} from '../report-statistics/lib/build-chart'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import {
  SalaryAnalysisOutlierDirectionEnum,
  SalaryAnalysisOutlierDto,
  SalaryAnalysisResponseDto,
} from './dto/salary-analysis.response.dto'
import { IApplicationService } from './application.service.interface'

const LOGGING_CONTEXT = 'ApplicationService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

@Injectable()
export class ApplicationService implements IApplicationService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IConfigService) private readonly configService: IConfigService,
    @Inject(IReportService) private readonly reportService: IReportService,
    @Inject(IReportCreateService)
    private readonly reportCreateService: IReportCreateService,
    @Inject(IReportCommentService)
    private readonly reportCommentService: IReportCommentService,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
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
    input: CreateReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.logger.info('Submitting salary report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      identifier: input.identifier,
    })
    this.assertCompaniesBelongToResolvedCompany(input.companies, company)
    return this.reportCreateService.createSalary(input)
  }

  async submitEquality(
    input: CreateEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.logger.info('Submitting equality report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      identifier: input.identifier,
    })
    this.assertCompaniesBelongToResolvedCompany(input.companies, company)
    return this.reportCreateService.createEquality(input)
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

  async getReport(
    reportId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto> {
    const report = await this.reportModel.findOne({ where: { id: reportId } })

    if (!report) {
      throw new NotFoundException(`Report "${reportId}" not found`)
    }

    const companyRows = await this.companyReportModel.findAll({
      where: { reportId },
      order: [['createdAt', 'ASC']],
    })

    const parentCompany = companyRows.find(
      (row) => row.parentCompanyId === null,
    )
    if (!parentCompany || parentCompany.companyId !== company.id) {
      throw new NotFoundException(`Report "${reportId}" not found`)
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
      outliers: salaryData.outliers,
      result: salaryData.result,
      externalComments,
      denialReason,
    }
  }

  /**
   * Body-shape check on `companies[]`:
   *
   * - Exactly one row has `parentCompanyId === null` (the parent), and its
   *   `companyId` matches the JWT-resolved company.
   * - Every other row points at the resolved company via `parentCompanyId`.
   *
   * This catches the obvious "wrong companyId in body" case. The deeper
   * "are these listed subsidiaries actually this company's gov-registered
   * subsidiaries" check requires an external registry call we don't have
   * wired up yet — see TODO below.
   */
  private assertCompaniesBelongToResolvedCompany(
    companies: CreateReportCompanySnapshotDto[],
    company: CompanyDto,
  ) {
    const parents = companies.filter((c) => c.parentCompanyId === null)

    if (parents.length !== 1) {
      throw new BadRequestException(
        `Expected exactly one parent company in companies[] (parentCompanyId=null), found ${parents.length}`,
      )
    }

    const [parent] = parents
    if (parent.companyId !== company.id) {
      throw new BadRequestException(
        `Parent company in companies[] does not match the authenticated company`,
      )
    }

    for (const subsidiary of companies) {
      if (subsidiary.parentCompanyId === null) continue
      if (subsidiary.parentCompanyId !== company.id) {
        throw new BadRequestException(
          `Subsidiary company "${subsidiary.companyId}" must point at the authenticated company as its parent`,
        )
      }
    }

    // TODO: external API call — verify each subsidiary in `companies[]` is
    // actually a gov-registered subsidiary of the authenticated company.
    // The third-party wiring is not yet available; until it lands the
    // checks above are body-shape only.
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
    outliers: ApplicationReportDetailDto['outliers']
  }> {
    if (report.type !== ReportTypeEnum.SALARY) {
      return { result: null, outliers: [] }
    }

    const [result, outlierRows] = await Promise.all([
      this.getReportResultOrNull(report.id),
      this.reportEmployeeOutlierModel.findAll({
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
      outliers: outlierRows.map((row) =>
        ReportEmployeeOutlierModel.fromModel(row),
      ),
    }
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
  const { assessment, bucket } = detected

  return {
    employeeOrdinal: detected.ordinal,
    adjustedBaseSalary: Math.round(detected.adjustedBaseSalary),
    direction:
      (assessment.direction as SalaryAnalysisOutlierDirectionEnum | null) ??
      SalaryAnalysisOutlierDirectionEnum.EQUAL,
    differencePercent: assessment.differencePercent ?? 0,
    allowedDifferencePercent: assessment.allowedDifferencePercent,
    referenceSalary: assessment.referenceSalary,
    scoreBucketRangeFrom: bucket.rangeFrom,
    scoreBucketRangeTo: bucket.rangeTo,
  }
}
