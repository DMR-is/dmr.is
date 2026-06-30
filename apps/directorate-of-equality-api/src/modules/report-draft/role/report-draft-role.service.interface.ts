import { CompanyDto } from '../../company/dto/company.dto'
import { ReportEmployeeRoleDto } from '../../report-employee/dto/report-employee-role.dto'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'

/**
 * CRUD for the employee roles of a DRAFT report. Roles are report-scoped
 * children (see the `report_id` column); every operation is gated through the
 * draft ownership resolver, so it only ever touches the company's own draft.
 */
export interface IReportDraftRoleService {
  listRoles(
    providerId: string,
    company: CompanyDto,
  ): Promise<ReportEmployeeRoleDto[]>

  createRole(
    providerId: string,
    company: CompanyDto,
    input: CreateRoleDto,
  ): Promise<ReportEmployeeRoleDto>

  updateRole(
    providerId: string,
    company: CompanyDto,
    roleId: string,
    input: UpdateRoleDto,
  ): Promise<ReportEmployeeRoleDto>

  deleteRole(
    providerId: string,
    company: CompanyDto,
    roleId: string,
  ): Promise<void>
}

export const IReportDraftRoleService = Symbol('IReportDraftRoleService')
