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
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import {
  SalaryAnalysisOutlierDirectionEnum,
  SalaryAnalysisOutlierDto,
  SalaryAnalysisResponseDto,
} from './dto/salary-analysis.response.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import type {
  SubmitReportCompanyDto,
  SubmitReportSubsidiaryDto,
} from './dto/submit-report-company.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import { IApplicationService } from './application.service.interface'

const LOGGING_CONTEXT = 'ApplicationService'
const SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY =
  'salary_difference_threshold_percent'

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
    input: SubmitSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto> {
    this.logger.info('Submitting salary report from application portal', {
      context: LOGGING_CONTEXT,
      companyId: company.id,
      identifier: input.identifier,
    })

    const createInput = await this.createSalaryReportInput(input, company)
    return this.reportCreateService.createSalary(createInput)
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

  private async createSalaryReportInput(
    input: SubmitSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportDto> {
    const companies = await this.createReportCompanySnapshots(input, company)

    return {
      equalityReportId: input.equalityReportId,
      identifier: input.identifier,
      importedFromExcel: input.importedFromExcel,
      providerType: input.providerType,
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
      outliers: input.outliers,
    }
  }

  private async createEqualityReportInput(
    input: SubmitEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateEqualityReportDto> {
    const companies = await this.createReportCompanySnapshots(input, company)

    return {
      identifier: input.identifier,
      providerType: input.providerType,
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
          await this.companyService.getOrCreateReportSnapshotSource(subsidiary)

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
