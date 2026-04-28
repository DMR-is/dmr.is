import { Op } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyReportModel } from '../company/models/company-report.model'
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
import { ReportEmployeeDeviationModel } from '../report-employee/models/report-employee-deviation.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import {
  ParsedReportDto,
  ParsedRoleDto,
  ParsedStepAssignmentDto,
} from '../report-excel/dto/parsed-report.dto'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'
import { IReportCreateService } from './report-create.service.interface'

const LOGGING_CONTEXT = 'ReportCreateService'

const stepKey = (criterionTitle: string, subTitle: string, stepOrder: number) =>
  `${criterionTitle}|${subTitle}|${stepOrder}`

@Injectable()
export class ReportCreateService implements IReportCreateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(ReportEventModel)
    private readonly reportEventModel: typeof ReportEventModel,
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
    @InjectModel(ReportEmployeeDeviationModel)
    private readonly reportEmployeeDeviationModel: typeof ReportEmployeeDeviationModel,
    @InjectModel(ReportCriterionModel)
    private readonly reportCriterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly reportSubCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly reportSubCriterionStepModel: typeof ReportSubCriterionStepModel,
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
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
    const stepScoreByKey = this.assertParsedPayloadIntegrity(input.parsed)
    const employeeScores = this.computeEmployeeScores(input.parsed, stepScoreByKey)
    this.assertDeviationsReferenceParsedEmployees(input)

    await this.assertEqualityReportApproved(input.equalityReportId)

    // 1. report row — status SUBMITTED so it lands in the reviewer queue.
    const report = await this.reportModel.create(
      {
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.SUBMITTED,
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
      },
    )

    this.logger.info(`Created SALARY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    // 2. company_report snapshots — one row per participating company.
    await this.companyReportModel.bulkCreate(
      input.companies.map((company) => ({
        companyId: company.companyId,
        reportId: report.id,
        parentCompanyId: company.parentCompanyId,
        name: company.name,
        nationalId: company.nationalId,
        address: company.address,
        city: company.city,
        postcode: company.postcode,
        averageEmployeeCountFromRsk: company.averageEmployeeCountFromRsk,
        isatCategory: company.isatCategory,
      })),
    )

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
      const criterionRow = await this.reportCriterionModel.create(
        {
          title: criterion.title,
          weight: criterion.weight,
          description: criterion.description,
          type: criterion.type,
          reportId: report.id,
        },
      )

      for (const subCriterion of criterion.subCriteria) {
        const subCriterionRow = await this.reportSubCriterionModel.create(
          {
            title: subCriterion.title,
            description: subCriterion.description,
            weight: subCriterion.weight,
            reportCriterionId: criterionRow.id,
          },
        )

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
    const personalStepRows = input.parsed.employees.flatMap(
      (employee, index) =>
        employee.personalStepAssignments.map((assignment) => ({
          reportEmployeeId: employeeRows[index].id,
          reportSubCriterionStepId: this.requireStepId(
            stepKeyToId,
            assignment,
          ),
        })),
    )
    if (personalStepRows.length > 0) {
      await this.personalStepModel.bulkCreate(personalStepRows)
    }

    // 8. Salary-outlier deviations — only employees the company flagged
    //    via the outlier-preview flow get a row here.
    if (input.deviations && input.deviations.length > 0) {
      const employeeOrdinalToId = new Map<number, string>()
      input.parsed.employees.forEach((employee, index) => {
        employeeOrdinalToId.set(employee.ordinal, employeeRows[index].id)
      })

      await this.reportEmployeeDeviationModel.bulkCreate(
        input.deviations.map((deviation) => ({
          // Pre-flight already verified every ordinal resolves.
          reportEmployeeId: employeeOrdinalToId.get(
            deviation.employeeOrdinal,
          ) as string,
          reason: deviation.reason,
          action: deviation.action,
          signatureName: deviation.signatureName,
          signatureRole: deviation.signatureRole,
        })),
      )
    }

    // 9. Persisted snapshot — reviewers need the computed aggregates available
    //    immediately on the SUBMITTED row. Runs in the same CLS-managed request
    //    transaction so a snapshot failure rolls the whole submission back.
    await this.reportResultService.createForReport(report.id)

    // 10. SUBMITTED audit event — actorUserId null = company admin.
    await this.reportEventModel.create(
      {
        reportId: report.id,
        eventType: ReportEventTypeEnum.SUBMITTED,
        reportStatus: ReportStatusEnum.SUBMITTED,
        actorUserId: null,
      },
    )

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
    const report = await this.reportModel.create(
      {
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.SUBMITTED,
        identifier: input.identifier,
        importedFromExcel: false,
        providerType: input.providerType,
        providerId: input.providerId,
        companyAdminName: input.companyAdminName,
        companyAdminEmail: input.companyAdminEmail,
        companyAdminGender: input.companyAdminGender,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        equalityReportContent: input.equalityReportContent,
      },
    )

    this.logger.info(`Created EQUALITY report row "${report.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    await this.companyReportModel.bulkCreate(
      input.companies.map((company) => ({
        companyId: company.companyId,
        reportId: report.id,
        parentCompanyId: company.parentCompanyId,
        name: company.name,
        nationalId: company.nationalId,
        address: company.address,
        city: company.city,
        postcode: company.postcode,
        averageEmployeeCountFromRsk: company.averageEmployeeCountFromRsk,
        isatCategory: company.isatCategory,
      })),
    )

    await this.reportEventModel.create(
      {
        reportId: report.id,
        eventType: ReportEventTypeEnum.SUBMITTED,
        reportStatus: ReportStatusEnum.SUBMITTED,
        actorUserId: null,
      },
    )

    return { reportId: report.id }
  }

  /**
   * Pre-flight integrity checks on the parsed payload — surfaces malformed
   * input as a 400 before any DB writes. Catches duplicate titles, unknown
   * role references in employees, and step assignments that don't resolve to
   * a node in the parsed criteria tree.
   *
   * Returns a `(criterionTitle|subTitle|stepOrder) → step score` map so the
   * caller can compute employee total scores in memory without re-walking
   * the criteria tree.
   */
  private assertParsedPayloadIntegrity(
    parsed: ParsedReportDto,
  ): Map<string, number> {
    const roleTitles = new Set<string>()
    for (const role of parsed.roles) {
      if (roleTitles.has(role.title)) {
        throw new BadRequestException(
          `Duplicate role title in parsed payload: "${role.title}"`,
        )
      }
      roleTitles.add(role.title)
    }

    const stepScoreByKey = new Map<string, number>()
    const criterionTitles = new Set<string>()
    for (const criterion of parsed.criteria) {
      if (criterionTitles.has(criterion.title)) {
        throw new BadRequestException(
          `Duplicate criterion title in parsed payload: "${criterion.title}"`,
        )
      }
      criterionTitles.add(criterion.title)

      const subTitlesInCriterion = new Set<string>()
      for (const sub of criterion.subCriteria) {
        if (subTitlesInCriterion.has(sub.title)) {
          throw new BadRequestException(
            `Duplicate sub-criterion title under "${criterion.title}": "${sub.title}"`,
          )
        }
        subTitlesInCriterion.add(sub.title)

        const stepOrders = new Set<number>()
        for (const step of sub.steps) {
          if (stepOrders.has(step.order)) {
            throw new BadRequestException(
              `Duplicate step order under "${criterion.title} / ${sub.title}": ${step.order}`,
            )
          }
          stepOrders.add(step.order)
          stepScoreByKey.set(
            stepKey(criterion.title, sub.title, step.order),
            step.score,
          )
        }
      }
    }

    for (const role of parsed.roles) {
      for (const assignment of role.stepAssignments) {
        const key = stepKey(
          assignment.criterionTitle,
          assignment.subTitle,
          assignment.stepOrder,
        )
        if (!stepScoreByKey.has(key)) {
          throw new BadRequestException(
            `Role "${role.title}" references unknown step ${key}`,
          )
        }
      }
    }

    for (const employee of parsed.employees) {
      if (!roleTitles.has(employee.roleTitle)) {
        throw new BadRequestException(
          `Employee ordinal ${employee.ordinal} references unknown role "${employee.roleTitle}"`,
        )
      }
      for (const assignment of employee.personalStepAssignments) {
        const key = stepKey(
          assignment.criterionTitle,
          assignment.subTitle,
          assignment.stepOrder,
        )
        if (!stepScoreByKey.has(key)) {
          throw new BadRequestException(
            `Employee ordinal ${employee.ordinal} references unknown step ${key}`,
          )
        }
      }
    }

    return stepScoreByKey
  }

  /**
   * Each `deviations[].employeeOrdinal` must match an `ordinal` in the parsed
   * employees array. Outlier detection is the application's responsibility
   * (planned outlier-preview endpoint — see `db/README.md` Notes); this
   * service trusts the caller's flagging but rejects orphan references.
   */
  private assertDeviationsReferenceParsedEmployees(input: CreateReportDto) {
    if (!input.deviations || input.deviations.length === 0) {
      return
    }
    const knownOrdinals = new Set(input.parsed.employees.map((e) => e.ordinal))
    for (const deviation of input.deviations) {
      if (!knownOrdinals.has(deviation.employeeOrdinal)) {
        throw new BadRequestException(
          `Deviation references unknown employee ordinal ${deviation.employeeOrdinal}`,
        )
      }
    }
  }

  /**
   * Total score per employee = sum of step scores assigned to them, dedup'd
   * across role and personal assignments (one stepKey contributes once even
   * if both the role and the employee personally reference it). Mirrors the
   * Set-based dedup used by `report-statistics.computeEmployeeWorkScore`.
   */
  private computeEmployeeScores(
    parsed: ParsedReportDto,
    stepScoreByKey: Map<string, number>,
  ): number[] {
    const rolesByTitle = new Map<string, ParsedRoleDto>()
    for (const role of parsed.roles) {
      rolesByTitle.set(role.title, role)
    }

    return parsed.employees.map((employee) => {
      const role = rolesByTitle.get(employee.roleTitle)
      const stepKeys = new Set<string>()
      if (role) {
        for (const a of role.stepAssignments) {
          stepKeys.add(stepKey(a.criterionTitle, a.subTitle, a.stepOrder))
        }
      }
      for (const a of employee.personalStepAssignments) {
        stepKeys.add(stepKey(a.criterionTitle, a.subTitle, a.stepOrder))
      }
      let total = 0
      for (const key of stepKeys) {
        total += stepScoreByKey.get(key) ?? 0
      }
      return total
    })
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
