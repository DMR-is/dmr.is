import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { DraftAssignmentDto } from './dto/draft-assignment.dto'

/**
 * Read/replace the scoring-step assignments of a DRAFT report's roles and
 * employees. Set is replace-all per owner: the join rows are immutable, so a
 * set destroys the owner's existing rows and re-creates them. Every step id is
 * validated to belong to the same draft.
 */
export interface IReportDraftAssignmentService {
  getRoleSteps(
    providerId: string,
    company: CompanyDto,
    roleId: string,
  ): Promise<DraftAssignmentDto>

  setRoleSteps(
    report: ReportModel,
    roleId: string,
    stepIds: string[],
  ): Promise<void>

  getEmployeeSteps(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<DraftAssignmentDto>

  setEmployeeSteps(
    report: ReportModel,
    employeeId: string,
    stepIds: string[],
  ): Promise<void>
}

export const IReportDraftAssignmentService = Symbol(
  'IReportDraftAssignmentService',
)
