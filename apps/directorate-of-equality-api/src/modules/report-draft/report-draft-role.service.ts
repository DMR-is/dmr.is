import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../company/dto/company.dto'
import { ReportEmployeeRoleDto } from '../report-employee/dto/report-employee-role.dto'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { IReportDraftService } from './report-draft.service.interface'
import { IReportDraftRoleService } from './report-draft-role.service.interface'

const LOGGING_CONTEXT = 'ReportDraftRoleService'

@Injectable()
export class ReportDraftRoleService implements IReportDraftRoleService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @InjectModel(ReportEmployeeRoleModel)
    private readonly roleModel: typeof ReportEmployeeRoleModel,
    @InjectModel(ReportEmployeeModel)
    private readonly employeeModel: typeof ReportEmployeeModel,
  ) {}

  async listRoles(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportEmployeeRoleDto[]> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const rows = await this.roleModel.findAll({
      where: { reportId: report.id },
      order: [['title', 'ASC']],
    })

    return rows.map((row) => ReportEmployeeRoleModel.fromModel(row))
  }

  async createRole(
    providerId: string,
    company: CompanyDto,
    input: CreateRoleDto,
  ): Promise<ReportEmployeeRoleDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.roleModel.create({
      title: input.title.trim(),
      reportId: report.id,
    })

    this.logger.info(`Created draft role "${row.id}"`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })

    return ReportEmployeeRoleModel.fromModel(row)
  }

  async updateRole(
    providerId: string,
    company: CompanyDto,
    roleId: string,
    input: UpdateRoleDto,
  ): Promise<ReportEmployeeRoleDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedRole(report.id, roleId)
    await row.update({ title: input.title.trim() })

    return ReportEmployeeRoleModel.fromModel(row)
  }

  async deleteRole(
    providerId: string,
    company: CompanyDto,
    roleId: string,
  ): Promise<void> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    const row = await this.findOwnedRole(report.id, roleId)

    // Employees reference a role by NOT NULL FK — refuse to orphan them.
    const referencing = await this.employeeModel.count({
      where: { reportEmployeeRoleId: roleId },
    })
    if (referencing > 0) {
      throw new ConflictException(
        `Role "${roleId}" is still assigned to ${referencing} employee(s); reassign or remove them first`,
      )
    }

    await row.destroy()
  }

  /** Loads a role and asserts it belongs to the given (already-owned) draft. */
  private async findOwnedRole(
    reportId: string,
    roleId: string,
  ): Promise<ReportEmployeeRoleModel> {
    const row = await this.roleModel.findOne({
      where: { id: roleId, reportId },
    })
    if (!row) {
      throw new NotFoundException(`Role "${roleId}" not found`)
    }
    return row
  }
}
