import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { DraftAssignmentDto } from './dto/draft-assignment.dto'
import { IReportDraftAssignmentService } from './report-draft-assignment.service.interface'

const LOGGING_CONTEXT = 'ReportDraftAssignmentService'

@Injectable()
export class ReportDraftAssignmentService
  implements IReportDraftAssignmentService
{
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly roleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportSubCriterionStepModel)
    private readonly stepModel: typeof ReportSubCriterionStepModel,
    @InjectModel(ReportSubCriterionModel)
    private readonly subCriterionModel: typeof ReportSubCriterionModel,
    @InjectModel(ReportCriterionModel)
    private readonly criterionModel: typeof ReportCriterionModel,
    @InjectModel(ReportEmployeeRoleCriterionStepModel)
    private readonly roleStepModel: typeof ReportEmployeeRoleCriterionStepModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
  ) {}

  async getRoleSteps(
    providerId: string,
    company: CompanyDto,
    roleId: string,
  ): Promise<DraftAssignmentDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertRoleInReport(report.id, roleId)

    const rows = await this.roleStepModel.findAll({
      where: { reportEmployeeRoleId: roleId },
      attributes: ['reportSubCriterionStepId'],
    })

    return { stepIds: rows.map((row) => row.reportSubCriterionStepId) }
  }

  async setRoleSteps(
    report: ReportModel,
    roleId: string,
    stepIds: string[],
  ): Promise<void> {
    await this.assertRoleInReport(report.id, roleId)
    const resolvedStepIds = await this.assertStepsInReport(report.id, stepIds)

    // Replace-all: the join rows are immutable, so clear then recreate. Atomic
    // under the CLS request transaction.
    await this.roleStepModel.destroy({
      where: { reportEmployeeRoleId: roleId },
    })
    if (resolvedStepIds.length > 0) {
      await this.roleStepModel.bulkCreate(
        resolvedStepIds.map((stepId) => ({
          reportEmployeeRoleId: roleId,
          reportSubCriterionStepId: stepId,
        })),
      )
    }

    this.logger.info(
      `Set ${resolvedStepIds.length} step(s) on role "${roleId}"`,
      {
        context: LOGGING_CONTEXT,
        reportId: report.id,
      },
    )
  }

  async getEmployeeSteps(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<DraftAssignmentDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )
    await this.assertEmployeeInReport(report.id, employeeId)

    const rows = await this.personalStepModel.findAll({
      where: { reportEmployeeId: employeeId },
      attributes: ['reportSubCriterionStepId'],
    })

    return { stepIds: rows.map((row) => row.reportSubCriterionStepId) }
  }

  async setEmployeeSteps(
    report: ReportModel,
    employeeId: string,
    stepIds: string[],
  ): Promise<void> {
    await this.assertEmployeeInReport(report.id, employeeId)
    const resolvedStepIds = await this.assertStepsInReport(report.id, stepIds)

    await this.personalStepModel.destroy({
      where: { reportEmployeeId: employeeId },
    })
    if (resolvedStepIds.length > 0) {
      await this.personalStepModel.bulkCreate(
        resolvedStepIds.map((stepId) => ({
          reportEmployeeId: employeeId,
          reportSubCriterionStepId: stepId,
        })),
      )
    }

    this.logger.info(
      `Set ${resolvedStepIds.length} personal step(s) on employee "${employeeId}"`,
      { context: LOGGING_CONTEXT, reportId: report.id },
    )
  }

  private async assertRoleInReport(
    reportId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.roleModel.findOne({
      where: { id: roleId, reportId },
      attributes: ['id'],
    })
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`)
    }
  }

  private async assertEmployeeInReport(
    reportId: string,
    employeeId: string,
  ): Promise<void> {
    const employee = await this.employeeModel.findOne({
      where: { id: employeeId, reportId },
      attributes: ['id'],
    })
    if (!employee) {
      throw new NotFoundException(`Employee "${employeeId}" not found`)
    }
  }

  /**
   * Validates that every (deduped) step id resolves, through its sub-criterion
   * and criterion, to the given report. Returns the deduped id list. Throws 400
   * on any unknown or foreign step.
   */
  private async assertStepsInReport(
    reportId: string,
    stepIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(stepIds)]
    if (unique.length === 0) {
      return []
    }

    const steps = await this.stepModel.findAll({
      where: { id: unique },
      attributes: ['id', 'reportSubCriterionId'],
    })
    if (steps.length !== unique.length) {
      throw new BadRequestException('One or more steps do not exist')
    }

    const subIds = [...new Set(steps.map((s) => s.reportSubCriterionId))]
    const subs = await this.subCriterionModel.findAll({
      where: { id: subIds },
      attributes: ['id', 'reportCriterionId'],
    })
    const criterionIds = [...new Set(subs.map((s) => s.reportCriterionId))]

    const validCriterionCount = await this.criterionModel.count({
      where: { id: criterionIds, reportId },
    })
    if (validCriterionCount !== criterionIds.length) {
      throw new BadRequestException(
        'One or more steps do not belong to this report',
      )
    }

    return unique
  }
}
