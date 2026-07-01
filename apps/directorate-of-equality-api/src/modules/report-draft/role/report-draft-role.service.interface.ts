import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { ReportEmployeeRoleDto } from '../../report-employee/dto/report-employee-role.dto'
import { RoleChangeDataDto } from '../sync/dto/change-role.dto'

/**
 * Employee roles of a DRAFT report. Reads go through the draft ownership
 * resolver; writes are sync appliers that take an already-resolved draft
 * (`report`) so the whole batch shares one ownership check and one transaction.
 */
export interface IReportDraftRoleService {
  listRoles(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportEmployeeRoleDto[]>

  /** Upsert a role from a sync CREATE command (client-minted id). */
  createRole(
    report: ReportModel,
    id: string,
    data: RoleChangeDataDto,
  ): Promise<void>

  /** Patch a role from a sync UPDATE command. */
  updateRole(
    report: ReportModel,
    id: string,
    data: RoleChangeDataDto,
  ): Promise<void>

  /** Remove a role from a sync REMOVE command. */
  removeRole(report: ReportModel, id: string): Promise<void>
}

export const IReportDraftRoleService = Symbol('IReportDraftRoleService')
