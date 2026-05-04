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

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import { detectOutliers } from '../report/lib/compensation-aggregates'
import {
  assertParsedPayloadIntegrity,
  computeEmployeeScores,
  stepKey,
} from '../report/lib/employee-scores'
import {
  ReportModel,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ParsedStepAssignmentDto } from '../report-excel/dto/parsed-report.dto'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import {
  CreateReportCompanySnapshotDto,
  CreateReportDto,
} from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'
import { IReportCreateService } from './report-create.service.interface'

const LOGGING_CONTEXT = 'ReportCreateService'

@Injectable()
export class ReportCreateService implements IReportCreateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly reportEmployeeRoleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly reportEmployeeOutlierModel: typeof ReportEmployeeOutlierModel,
    @InjectModel(ReportCriterionModel)
    private readonly reportCriterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly reportSubCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly reportSubCriterionStepModel: typeof ReportSubCriterionStepModel,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
    @Inject(IConfigService)
    private readonly configService: IConfigService,
  ) {}

  async createSalary(input: CreateReportDto): Promise<CreateReportResponseDto> {
    return this.createSalaryReport(input)
  }

  async createEquality(
    input: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.createEqualityReport(input)
  }

  private async createSalaryReport(
    input: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    const stepScoreByKey = assertParsedPayloadIntegrity(input.parsed)
    const employeeScores = computeEmployeeScores(input.parsed, stepScoreByKey)
    this.assertOutliersReferenceParsedEmployees(input)
    await this.assertOutliersMatchDetectedOutliers(input, employeeScores)

    await this.assertEqualityReportApproved(input.equalityReportId)
    const submittingCompany = this.getSubmittingCompany(input.companies)
    const outliersPostponed = input.outliersPostponed ?? false

    // 1. report row — status SUBMITTED so it lands in the reviewer queue.
    const report = await this.reportModel.create({
      type: ReportTypeEnum.SALARY,
      status: ReportStatusEnum.SUBMITTED,
      equalityReportId: input.equalityReportId,
      identifier: input.identifier,
      importedFromExcel: input.importedFromExcel,
      outliersPostponed,
      providerType: input.providerType,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      companyNationalId: submittingCompany.nationalId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      averageEmployeeMaleCount: input.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: input.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: input.averageEmployeeNeutralCount,
    })

    this.logger.info(`Created SALARY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    // 2. company_report snapshots — one row per participating company.
    await this.createCompanyReportSnapshots(report.id, input.companies)

    // 3. roles — one row per parsed role. Map by title for FK resolution.
    const roleRows = await this.reportEmployeeRoleModel.bulkCreate(
      input.parsed.roles.map((role) => ({ title: role.title })),
    )
    const roleTitleToId = new Map<string, string>()
    input.parsed.roles.forEach((role, index) => {
      roleTitleToId.set(role.title, roleRows[index].id)
    })

    // 4. criteria → sub_criteria → steps. Capture step ids by composite key.
    const stepKeyToId = new Map<string, string>()
    for (const criterion of input.parsed.criteria) {
      const criterionRow = await this.reportCriterionModel.create({
        title: criterion.title,
        weight: criterion.weight,
        description: criterion.description,
        type: criterion.type,
        reportId: report.id,
      })

      for (const subCriterion of criterion.subCriteria) {
        const subCriterionRow = await this.reportSubCriterionModel.create({
          title: subCriterion.title,
          description: subCriterion.description,
          weight: subCriterion.weight,
          reportCriterionId: criterionRow.id,
        })

        const stepRows = await this.reportSubCriterionStepModel.bulkCreate(
          subCriterion.steps.map((step) => ({
            order: step.order,
            description: step.description,
            score: step.score,
            reportSubCriterionId: subCriterionRow.id,
          })),
        )

        subCriterion.steps.forEach((step, index) => {
          stepKeyToId.set(
            stepKey(criterion.title, subCriterion.title, step.order),
            stepRows[index].id,
          )
        })
      }
    }

    // 5. role ↔ step joins.
    const roleStepRows = input.parsed.roles.flatMap((role) =>
      role.stepAssignments.map((assignment) => ({
        reportEmployeeRoleId: this.requireRoleId(roleTitleToId, role.title),
        reportSubCriterionStepId: this.requireStepId(stepKeyToId, assignment),
      })),
    )
    if (roleStepRows.length > 0) {
      await this.roleStepModel.bulkCreate(roleStepRows)
    }

    // 6. employees — score is the precomputed total (sum of step scores from
    //    the role's assignments + the employee's personal assignments, with
    //    duplicates collapsed). Reviewers read this value as-is; the snapshot
    //    pipeline below also reads it.
    const employeeRows = await this.reportEmployeeModel.bulkCreate(
      input.parsed.employees.map((employee, index) => ({
        ordinal: employee.ordinal,
        education: employee.education,
        field: employee.field,
        department: employee.department,
        startDate: employee.startDate,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
        additionalSalary: employee.additionalSalary,
        bonusSalary: employee.bonusSalary,
        gender: employee.gender,
        reportEmployeeRoleId: this.requireRoleId(
          roleTitleToId,
          employee.roleTitle,
        ),
        reportId: report.id,
        score: employeeScores[index],
      })),
    )

    // 7. employee ↔ step personal joins.
    const personalStepRows = input.parsed.employees.flatMap((employee, index) =>
      employee.personalStepAssignments.map((assignment) => ({
        reportEmployeeId: employeeRows[index].id,
        reportSubCriterionStepId: this.requireStepId(stepKeyToId, assignment),
      })),
    )
    if (personalStepRows.length > 0) {
      await this.personalStepModel.bulkCreate(personalStepRows)
    }

    // 8. Salary outliers — only employees the company flagged
    //    via the outlier-preview flow get a row here. When the report is
    //    postponed, every row's explanation columns are written as NULL
    //    (the all-or-none invariant lives on report.outliersPostponed).
    if (input.outliers && input.outliers.length > 0) {
      const employeeOrdinalToId = new Map<number, string>()
      input.parsed.employees.forEach((employee, index) => {
        employeeOrdinalToId.set(employee.ordinal, employeeRows[index].id)
      })

      await this.reportEmployeeOutlierModel.bulkCreate(
        input.outliers.map((outlier) => ({
          // Pre-flight already verified every ordinal resolves.
          reportEmployeeId: employeeOrdinalToId.get(
            outlier.employeeOrdinal,
          ) as string,
          reason: outliersPostponed ? null : (outlier.reason ?? null),
          action: outliersPostponed ? null : (outlier.action ?? null),
          signatureName: outliersPostponed
            ? null
            : (outlier.signatureName ?? null),
          signatureRole: outliersPostponed
            ? null
            : (outlier.signatureRole ?? null),
        })),
      )
    }

    // 9. Persisted snapshot — reviewers need the computed aggregates available
    //    immediately on the SUBMITTED row. Runs in the same CLS-managed request
    //    transaction so a snapshot failure rolls the whole submission back.
    await this.reportResultService.createForReport(report.id)

    // 10. SUBMITTED audit event — actorUserId null = company admin.
    await this.reportEventModel.create({
      reportId: report.id,
      eventType: ReportEventTypeEnum.SUBMITTED,
      reportStatus: ReportStatusEnum.SUBMITTED,
      actorUserId: null,
      companyId: submittingCompany.companyId,
    })

    return { reportId: report.id }
  }

  /**
   * EQUALITY submissions are narrative-only — no criteria, no employees, no
   * snapshot. Just the `report` row, the `company_report` snapshots, and the
   * SUBMITTED audit event.
   */
  private async createEqualityReport(
    input: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    const submittingCompany = this.getSubmittingCompany(input.companies)

    const report = await this.reportModel.create({
      type: ReportTypeEnum.EQUALITY,
      status: ReportStatusEnum.SUBMITTED,
      identifier: input.identifier,
      importedFromExcel: false,
      providerType: input.providerType,
      providerId: input.providerId,
      companyAdminName: input.companyAdminName,
      companyAdminEmail: input.companyAdminEmail,
      companyAdminGender: input.companyAdminGender,
      companyNationalId: submittingCompany.nationalId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      equalityReportContent: input.equalityReportContent,
    })

    this.logger.info(`Created EQUALITY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    await this.createCompanyReportSnapshots(report.id, input.companies)

    await this.reportEventModel.create({
      reportId: report.id,
      eventType: ReportEventTypeEnum.SUBMITTED,
      reportStatus: ReportStatusEnum.SUBMITTED,
      actorUserId: null,
      companyId: submittingCompany.companyId,
    })

    return { reportId: report.id }
  }

  private getSubmittingCompany(
    companies: Array<{
      companyId: string
      nationalId: string
      parentCompanyId: string | null
    }>,
  ): { companyId: string; nationalId: string } {
    const parentCompanies = companies.filter(
      (company) => company.parentCompanyId === null,
    )

    if (parentCompanies.length !== 1) {
      throw new BadRequestException(
        `Expected exactly one parent company in companies[] (parentCompanyId=null), found ${parentCompanies.length}`,
      )
    }

    return {
      companyId: parentCompanies[0].companyId,
      nationalId: parentCompanies[0].nationalId,
    }
  }

  private async createCompanyReportSnapshots(
    reportId: string,
    companies: CreateReportCompanySnapshotDto[],
  ) {
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
      companies.map((company) => ({
        companyId: company.companyId,
        reportId,
        parentCompanyId: company.parentCompanyId,
        name: company.name,
        nationalId: company.nationalId,
        address: company.address,
        city: company.city,
        postcode: company.postcode,
        averageEmployeeCountFromRsk:
          companyById.get(company.companyId)!.averageEmployeeCountFromRsk,
        isatCategory: company.isatCategory,
      })),
    )
  }

  /**
   * Each `outliers[].employeeOrdinal` must match an `ordinal` in the parsed
   * employees array. Outlier detection is the application's responsibility
   * (planned outlier-preview endpoint — see `db/README.md` Notes); this
   * service trusts the caller's flagging but rejects orphan references.
   */
  private assertOutliersReferenceParsedEmployees(input: CreateReportDto) {
    if (!input.outliers || input.outliers.length === 0) {
      return
    }
    const knownOrdinals = new Set(input.parsed.employees.map((e) => e.ordinal))
    for (const outlier of input.outliers) {
      if (!knownOrdinals.has(outlier.employeeOrdinal)) {
        throw new BadRequestException(
          `Outlier references unknown employee ordinal ${outlier.employeeOrdinal}`,
        )
      }
    }
  }

  /**
   * Submit-side outlier guard. Recomputes the canonical outlier set with
   * `detectOutliers` (same helper the application-side preview uses) and
   * asserts:
   *
   * - Every detected outlier has an `outliers[]` row. Missing rows reject —
   *   postponement is acknowledgement-with-deferred-explanation, not skip-
   *   the-row.
   * - Every `outliers[]` row references a detected outlier. Extras reject.
   * - When `outliersPostponed` is false, every row has all four explanation
   *   columns filled. When true, explanation fields are ignored.
   *
   * Threshold is re-read from `config` here, so a tiny drift between preview
   * and submit is possible — rejection in that case just means "re-run
   * preview".
   */
  private async assertOutliersMatchDetectedOutliers(
    input: CreateReportDto,
    employeeScores: number[],
  ) {
    const submittedOutliers = input.outliers ?? []
    const outliersPostponed = input.outliersPostponed ?? false
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    const detected = detectOutliers({
      employees: input.parsed.employees.map((employee, index) => ({
        ordinal: employee.ordinal,
        score: employeeScores[index],
        gender: employee.gender,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
      })),
      thresholdPercent,
    })

    const detectedOrdinals = new Set(detected.map((d) => d.ordinal))
    const submittedOrdinals = new Set(
      submittedOutliers.map((o) => o.employeeOrdinal),
    )

    const extras = [...submittedOrdinals].filter(
      (ordinal) => !detectedOrdinals.has(ordinal),
    )
    if (extras.length > 0) {
      throw new BadRequestException(
        `Outlier row(s) submitted for non-outlier employee ordinal(s): ${extras.join(', ')}`,
      )
    }

    const missing = [...detectedOrdinals].filter(
      (ordinal) => !submittedOrdinals.has(ordinal),
    )
    if (missing.length > 0) {
      throw new BadRequestException(
        `Detected outlier(s) missing acknowledgement for employee ordinal(s): ${missing.join(', ')}`,
      )
    }

    if (outliersPostponed) {
      return
    }

    for (const outlier of submittedOutliers) {
      const missingFields = [
        ['reason', outlier.reason],
        ['action', outlier.action],
        ['signatureName', outlier.signatureName],
        ['signatureRole', outlier.signatureRole],
      ].filter(([, value]) => !value || (value as string).length === 0)

      if (missingFields.length > 0) {
        throw new BadRequestException(
          `Outlier for employee ordinal ${outlier.employeeOrdinal} is missing required field(s): ${missingFields.map(([name]) => name).join(', ')}`,
        )
      }
    }
  }

  private async getSalaryDifferenceThresholdPercent(): Promise<number> {
    const config = await this.configService.getByKey(
      'salary_difference_threshold_percent',
    )
    const parsed = parseFloat(config.value)

    if (!Number.isFinite(parsed)) {
      throw new InternalServerErrorException(
        'Config entry "salary_difference_threshold_percent" must be numeric',
      )
    }

    return parsed
  }

  /**
   * Schema invariant: a SALARY row's `equality_report_id` must point to an
   * EQUALITY row that was APPROVED at the moment of insert and is still
   * within its three-year validity window.
   */
  private async assertEqualityReportApproved(equalityReportId: string) {
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

  private requireRoleId(map: Map<string, string>, title: string): string {
    const id = map.get(title)
    if (!id) {
      throw new BadRequestException(`Role "${title}" was not created`)
    }
    return id
  }

  private requireStepId(
    map: Map<string, string>,
    assignment: ParsedStepAssignmentDto,
  ): string {
    const key = stepKey(
      assignment.criterionTitle,
      assignment.subTitle,
      assignment.stepOrder,
    )
    const id = map.get(key)
    if (!id) {
      throw new BadRequestException(`Step "${key}" was not created`)
    }
    return id
  }
}
