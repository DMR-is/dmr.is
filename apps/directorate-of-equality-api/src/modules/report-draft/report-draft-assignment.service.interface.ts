import { CompanyDto } from '../company/dto/company.dto'
import { DraftAssignmentDto } from './dto/draft-assignment.dto'
import { SetStepsDto } from './dto/set-steps.dto'

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
    providerId: string,
    company: CompanyDto,
    roleId: string,
    input: SetStepsDto,
  ): Promise<DraftAssignmentDto>

  getEmployeeSteps(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<DraftAssignmentDto>

  setEmployeeSteps(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
    input: SetStepsDto,
  ): Promise<DraftAssignmentDto>
}

export const IReportDraftAssignmentService = Symbol(
  'IReportDraftAssignmentService',
)
