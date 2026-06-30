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

import { CompanyDto } from '../company/dto/company.dto'
import { ReportEmployeeDto } from '../report-employee/dto/report-employee.dto'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { CreateDraftEmployeeDto } from './dto/create-draft-employee.dto'
import { GetDraftEmployeesResponseDto } from './dto/get-draft-employees-response.dto'
import { UpdateDraftEmployeeDto } from './dto/update-draft-employee.dto'
import { IReportDraftService } from './report-draft.service.interface'
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

  async createEmployee(
    providerId: string,
    company: CompanyDto,
    input: CreateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    await this.assertRoleInReport(report.id, input.reportEmployeeRoleId)

    // Sequential ordinal within the report; gaps from deletes are fine — the
    // ordinal is an identifier, not a dense index.
    const maxOrdinal = (await this.employeeModel.max('ordinal', {
      where: { reportId: report.id },
    })) as number | null

    const row = await this.employeeModel.create({
      reportId: report.id,
      ordinal: (maxOrdinal ?? 0) + 1,
      // Derived at submit — never computed while drafting.
      score: null,
      reportEmployeeRoleId: input.reportEmployeeRoleId,
      education: input.education,
      gender: input.gender,
      field: input.field,
      department: input.department,
      startDate: input.startDate,
      workRatio: input.workRatio,
      baseSalary: input.baseSalary,
      additionalFixedOvertime: input.additionalFixedOvertime ?? null,
      additionalFixedCarAllowance: input.additionalFixedCarAllowance ?? null,
      bonusOccasionalCarAllowance: input.bonusOccasionalCarAllowance ?? null,
      bonusOccasionalOvertime: input.bonusOccasionalOvertime ?? null,
      bonusPayments: input.bonusPayments ?? null,
      bonusOther: input.bonusOther ?? null,
    })

    this.logger.info(`Created draft employee "${row.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return ReportEmployeeModel.fromModel(row)
  }

  async updateEmployee(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
    input: UpdateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedEmployee(report.id, employeeId)

    if (input.reportEmployeeRoleId !== undefined) {
      await this.assertRoleInReport(report.id, input.reportEmployeeRoleId)
    }

    const patch: UpdateDraftEmployeeDto = {}
    for (const key of EMPLOYEE_PATCH_KEYS) {
      if (input[key] !== undefined) {
        // The key list is the source of truth; each value matches its column.
        ;(patch as Record<string, unknown>)[key] = input[key]
      }
    }

    if (Object.keys(patch).length > 0) {
      await row.update(patch)
    }

    return ReportEmployeeModel.fromModel(row)
  }

  async deleteEmployee(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedEmployee(report.id, employeeId)
    // NOTE: once personal step-assignment and outlier-group CRUD land, their
    // rows reference this employee and must be removed first (no DB cascade).
    // A draft built via employee CRUD alone has no such dependents yet.
    await row.destroy()
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
    })
    if (!role) {
      throw new BadRequestException(
        `Role "${roleId}" does not belong to this report`,
      )
    }
  }
}
