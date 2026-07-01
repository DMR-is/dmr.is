import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeRoleDto } from '../../report-employee/dto/report-employee-role.dto'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { RoleChangeDataDto } from '../sync/dto/change-role.dto'
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

  /**
   * Upserts a role from a sync CREATE command. The id is the client-minted PK,
   * so a repeated CREATE (retry) updates in place rather than duplicating. A
   * client id that already belongs to a different report is rejected.
   */
  async createRole(
    report: ReportModel,
    id: string,
    data: RoleChangeDataDto,
  ): Promise<void> {
    const title = data.title?.trim()
    if (!title) {
      throw new BadRequestException('Role CREATE requires a title')
    }

    const existing = await this.roleModel.findByPk(id)
    if (existing) {
      this.assertOwned(existing.reportId, report.id, id)
      await existing.update({ title })
      return
    }

    const row = this.roleModel.build({ title, reportId: report.id })
    row.id = id
    await row.save()

    this.logger.info(`Synced draft role "${id}" (create)`, {
      context: LOGGING_CONTEXT,
      reportId: report.id,
    })
  }

  /** Patches a role from a sync UPDATE command (404 if it is not on the draft). */
  async updateRole(
    report: ReportModel,
    id: string,
    data: RoleChangeDataDto,
  ): Promise<void> {
    const row = await this.findOwnedRole(report.id, id)
    if (data.title !== undefined) {
      const title = data.title.trim()
      if (!title) {
        throw new BadRequestException('Role title must not be empty')
      }
      await row.update({ title })
    }
  }

  /** Removes a role. Refuses to orphan employees that still reference it. */
  async removeRole(report: ReportModel, id: string): Promise<void> {
    const row = await this.findOwnedRole(report.id, id)

    // Employees reference a role by NOT NULL FK — refuse to orphan them. In a
    // sync batch, employee reassignments/removals run first, so this reflects
    // the batch's final state.
    const referencing = await this.employeeModel.count({
      where: { reportEmployeeRoleId: id },
    })
    if (referencing > 0) {
      throw new ConflictException(
        `Role "${id}" is still assigned to ${referencing} employee(s); reassign or remove them first`,
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

  /** A client-minted id must not collide with a row on another report. */
  private assertOwned(
    rowReportId: string,
    reportId: string,
    id: string,
  ): void {
    if (rowReportId !== reportId) {
      throw new BadRequestException(
        `Role "${id}" belongs to a different report`,
      )
    }
  }
}
