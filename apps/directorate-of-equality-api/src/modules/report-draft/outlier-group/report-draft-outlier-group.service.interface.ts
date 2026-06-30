import { CompanyDto } from '../../company/dto/company.dto'
import { ReportOutlierGroupDto } from '../../report-employee/dto/report-outlier-group.dto'
import { CreateOutlierGroupDto } from './dto/create-outlier-group.dto'
import { DraftOutlierGroupDto } from './dto/draft-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './dto/employee-outlier-group.dto'
import { SetEmployeeOutlierGroupDto } from './dto/set-employee-outlier-group.dto'
import { UpdateOutlierGroupDto } from './dto/update-outlier-group.dto'

/**
 * CRUD for a DRAFT report's outlier groups (the improvement-plan explanation
 * buckets) and per-employee group membership. Outliers themselves are derived
 * (see the analysis service); a member must be a currently-detected outlier.
 */
export interface IReportDraftOutlierGroupService {
  listGroups(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftOutlierGroupDto[]>

  createGroup(
    providerId: string,
    company: CompanyDto,
    input: CreateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto>

  updateGroup(
    providerId: string,
    company: CompanyDto,
    groupId: string,
    input: UpdateOutlierGroupDto,
  ): Promise<ReportOutlierGroupDto>

  deleteGroup(
    providerId: string,
    company: CompanyDto,
    groupId: string,
  ): Promise<void>

  getEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<EmployeeOutlierGroupDto>

  setEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
    input: SetEmployeeOutlierGroupDto,
  ): Promise<EmployeeOutlierGroupDto>

  clearEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<void>
}

export const IReportDraftOutlierGroupService = Symbol(
  'IReportDraftOutlierGroupService',
)
