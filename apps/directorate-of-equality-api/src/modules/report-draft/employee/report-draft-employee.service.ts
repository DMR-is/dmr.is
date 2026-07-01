import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared-dto'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import { CompanyDto } from '../../company/dto/company.dto'
import { GenderEnum } from '../../report/models/report.enums'
import { ReportModel } from '../../report/models/report.model'
import {
  EducationEnum,
  ReportEmployeeModel,
} from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { EmployeeChangeDataDto } from '../sync/dto/change-employee.dto'
import { GetDraftEmployeesResponseDto } from './dto/get-draft-employees-response.dto'
import { IReportDraftEmployeeService } from './report-draft-employee.service.interface'

const LOGGING_CONTEXT = 'ReportDraftEmployeeService'

/** Editable employee columns — `ordinal`, `score`, `reportId` are never patched. */
const EMPLOYEE_PATCH_KEYS = [
  'reportEmployeeRoleId',
  'education',
  'gender',
  'field',
  'department',
  'startDate',
  'workRatio',
  'baseSalary',
  'additionalFixedOvertime',
  'additionalFixedCarAllowance',
  'bonusOccasionalCarAllowance',
  'bonusOccasionalOvertime',
  'bonusPayments',
  'bonusOther',
] as const

/** Fields an employee CREATE must supply (the non-nullable columns). */
const EMPLOYEE_REQUIRED_KEYS = [
  'reportEmployeeRoleId',
  'education',
  'gender',
  'field',
  'department',
  'startDate',
  'workRatio',
  'baseSalary',
] as const

@Injectable()
export class ReportDraftEmployeeService implements IReportDraftEmployeeService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly roleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeePersonalCriterionStepModel)
    private readonly personalStepModel: typeof ReportEmployeePersonalCriterionStepModel,
    @InjectModel(ReportEmployeeOutlierModel)
    private readonly outlierModel: typeof ReportEmployeeOutlierModel,
  ) {}

  async listEmployees(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetDraftEmployeesResponseDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const { limit, offset } = getLimitAndOffset(query)

    const { rows, count } = await this.employeeModel.findAndCountAll({
      where: { reportId: report.id },
      order: [['ordinal', 'ASC']],
      limit,
      offset,
    })

    const employees = rows.map((row) => ReportEmployeeModel.fromModel(row))
    const paging = generatePaging(employees, query.page, query.pageSize, count)

    return { employees, paging }
  }

  /**
   * Highest ordinal currently in the report (0 if empty). The sync service
   * reads this once and hands out incrementing ordinals across the batch, so
   * bulk-created employees don't each run their own `max()` query.
   */
  async getMaxOrdinal(report: ReportModel): Promise<number> {
    const max = (await this.employeeModel.max('ordinal', {
      where: { reportId: report.id },
    })) as number | null
    return max ?? 0
  }

  /**
   * Upserts an employee from a sync CREATE command. `id` is the client-minted
   * PK (a repeated CREATE updates in place rather than duplicating) and
   * `ordinal` is assigned by the caller. `score` stays NULL — derived at submit.
   */
  async createEmployee(
    report: ReportModel,
    id: string,
    data: EmployeeChangeDataDto,
    ordinal: number,
  ): Promise<void> {
    for (const key of EMPLOYEE_REQUIRED_KEYS) {
      if (data[key] === undefined || data[key] === null) {
        throw new BadRequestException(
          `Employee CREATE requires "${key}"`,
        )
      }
    }
    await this.assertRoleInReport(report.id, data.reportEmployeeRoleId as string)

    const existing = await this.employeeModel.findByPk(id)
    if (existing) {
      if (existing.reportId !== report.id) {
        throw new BadRequestException(
          `Employee "${id}" belongs to a different report`,
        )
      }
      // Idempotent retry: update the row's columns in place (keep its ordinal).
      await existing.update(this.buildColumnPatch(data))
      return
    }

    // The required columns are guaranteed present by the guard above; the casts
    // narrow away the `undefined` the optional change-data DTO carries.
    const row = this.employeeModel.build({
      reportId: report.id,
      ordinal,
      score: null,
      reportEmployeeRoleId: data.reportEmployeeRoleId as string,
      education: data.education as EducationEnum,
      gender: data.gender as GenderEnum,
      field: data.field as string,
      department: data.department as string,
      startDate: data.startDate as string,
      workRatio: data.workRatio as number,
      baseSalary: data.baseSalary as number,
      additionalFixedOvertime: data.additionalFixedOvertime ?? null,
      additionalFixedCarAllowance: data.additionalFixedCarAllowance ?? null,
      bonusOccasionalCarAllowance: data.bonusOccasionalCarAllowance ?? null,
      bonusOccasionalOvertime: data.bonusOccasionalOvertime ?? null,
      bonusPayments: data.bonusPayments ?? null,
      bonusOther: data.bonusOther ?? null,
    })
    row.id = id
    await row.save()

    this.logger.info(`Synced draft employee "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches an employee from a sync UPDATE command (PATCH semantics). */
  async updateEmployee(
    report: ReportModel,
    id: string,
    data: EmployeeChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedEmployee(report.id, id)

    if (data.reportEmployeeRoleId !== undefined) {
      await this.assertRoleInReport(report.id, data.reportEmployeeRoleId)
    }

    const patch = this.buildColumnPatch(data)
    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }
  }

  /**
   * Removes an employee and the rows that reference it (personal step
   * assignments, outlier-group membership) — no DB cascade. Atomic under the
   * sync request transaction.
   */
  async removeEmployee(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedEmployee(report.id, id)

    await this.personalStepModel.destroy({ where: { reportEmployeeId: id } })
    await this.outlierModel.destroy({ where: { reportEmployeeId: id } })
    await row.destroy()
  }

  /** Builds a Sequelize patch of the editable columns present in `data`. */
  private buildColumnPatch(data: EmployeeChangeDataDto): Record<string, unknown> {
    const patch: Record<string, unknown> = {}
    for (const key of EMPLOYEE_PATCH_KEYS) {
      if (data[key] !== undefined) {
        patch[key] = data[key]
      }
    }
    return patch
  }

  /** Loads an employee and asserts it belongs to the given (owned) draft. */
  private async findOwnedEmployee(
    reportId: string,
    employeeId: string,
  ): Promise<ReportEmployeeModel> {
    const row = await this.employeeModel.findOne({
      where: { id: employeeId, reportId },
    })
    if (!row) {
      throw new NotFoundException(`Employee "${employeeId}" not found`)
    }
    return row
  }

  /** Rejects a role id that does not belong to the report (400). */
  private async assertRoleInReport(
    reportId: string,
    roleId: string,
  ): Promise<void> {
    const role = await this.roleModel.findOne({
      where: { id: roleId, reportId },
      attributes: ['id'],
    })
    if (!role) {
      throw new BadRequestException(
        `Role "${roleId}" does not belong to this report`,
      )
    }
  }
}
