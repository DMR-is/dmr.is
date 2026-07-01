import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { stepKey } from '../report/lib/employee-scores'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import {
  ParsedReportDto,
  ParsedStepAssignmentDto,
} from '../report-excel/dto/parsed-report.dto'
import { IReportContentService } from './report-content.service.interface'

const LOGGING_CONTEXT = 'ReportContentService'

@Injectable()
export class ReportContentService implements IReportContentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly reportEmployeeRoleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeeModel)
    private readonly reportEmployeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
    @InjectModel(ReportCriterionModel)
    private readonly reportCriterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly reportSubCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly reportSubCriterionStepModel: typeof ReportSubCriterionStepModel,
  ) {}

  async persistParsedChildren(
    reportId: string,
    parsed: ParsedReportDto,
    employeeScores: (number | null)[],
  ): Promise<{ employeeOrdinalToId: Map<number, string> }> {
    // 3. roles — one row per parsed role. Map by title for FK resolution.
    const roleRows = await this.reportEmployeeRoleModel.bulkCreate(
      parsed.roles.map((role) => ({
        title: role.title,
        reportId,
      })),
    )
    const roleTitleToId = new Map<string, string>()
    parsed.roles.forEach((role, index) => {
      roleTitleToId.set(role.title, roleRows[index].id)
    })

    // 4. criteria → sub_criteria → steps. Capture step ids by composite key.
    const stepKeyToId = new Map<string, string>()
    for (const criterion of parsed.criteria) {
      const criterionRow = await this.reportCriterionModel.create({
        title: criterion.title,
        weight: criterion.weight,
        description: criterion.description,
        type: criterion.type,
        reportId,
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
    const roleStepRows = parsed.roles.flatMap((role) =>
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
      parsed.employees.map((employee, index) => ({
        ordinal: employee.ordinal,
        education: employee.education,
        field: employee.field,
        department: employee.department,
        startDate: employee.startDate,
        workRatio: employee.workRatio,
        baseSalary: employee.baseSalary,
        additionalFixedOvertime: employee.additionalFixedOvertime,
        additionalFixedCarAllowance: employee.additionalFixedCarAllowance,
        bonusOccasionalCarAllowance: employee.bonusOccasionalCarAllowance,
        bonusOccasionalOvertime: employee.bonusOccasionalOvertime,
        bonusPayments: employee.bonusPayments,
        bonusOther: employee.bonusOther,
        gender: employee.gender,
        reportEmployeeRoleId: this.requireRoleId(
          roleTitleToId,
          employee.roleTitle,
        ),
        reportId,
        score: employeeScores[index],
      })),
    )

    // 7. employee ↔ step personal joins.
    const personalStepRows = parsed.employees.flatMap((employee, index) =>
      employee.personalStepAssignments.map((assignment) => ({
        reportEmployeeId: employeeRows[index].id,
        reportSubCriterionStepId: this.requireStepId(stepKeyToId, assignment),
      })),
    )
    if (personalStepRows.length > 0) {
      await this.personalStepModel.bulkCreate(personalStepRows)
    }

    const employeeOrdinalToId = new Map<number, string>()
    parsed.employees.forEach((employee, index) => {
      employeeOrdinalToId.set(employee.ordinal, employeeRows[index].id)
    })

    this.logger.debug(`Persisted parsed children for report "${reportId}"`, {
      context: LOGGING_CONTEXT,
      reportId,
    })

    return { employeeOrdinalToId }
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
