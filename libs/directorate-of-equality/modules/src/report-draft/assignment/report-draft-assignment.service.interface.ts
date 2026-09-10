import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { DraftAssignmentDto } from './dto/draft-assignment.dto'

/** Which side of the scoring graph a snapshotted assignment hangs off. */
export enum AssignmentOwnerEnum {
  ROLE = 'ROLE',
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * One step assignment as it stood BEFORE a sync batch was applied, captured so
 * the batch's step removals can be re-homed instead of silently dropped.
 *
 * `order` is the order the (about to be removed) step held before the batch;
 * the replacement is resolved against the POST-batch step set of
 * `subCriterionId`, which is what makes a wholesale template swap — every step
 * removed and a fresh set created — fall out of the same rule.
 */
export interface PreBatchAssignment {
  owner: AssignmentOwnerEnum
  ownerId: string
  subCriterionId: string
  order: number
}

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

  /**
   * Snapshots the role and employee assignments pointing at `stepIds`, together
   * with each step's current `order`, before those steps are removed. Must be
   * called before the batch writes anything: `removeStep` destroys the join
   * rows outright, leaving nothing to reconstruct the assignment from.
   *
   * Unknown or foreign step ids are ignored here — `removeStep` is the one that
   * rejects them, and it rolls the whole batch back before any clamp runs.
   */
  snapshotAssignmentsForSteps(
    report: ReportModel,
    stepIds: string[],
  ): Promise<PreBatchAssignment[]>

  /**
   * Re-homes snapshotted assignments whose step is gone, to the nearest
   * surviving step of the same sub-criterion. Call once, after every command in
   * the batch has been applied.
   */
  clampOrphanedAssignments(
    report: ReportModel,
    snapshots: PreBatchAssignment[],
  ): Promise<void>
}

export const IReportDraftAssignmentService = Symbol(
  'IReportDraftAssignmentService',
)
