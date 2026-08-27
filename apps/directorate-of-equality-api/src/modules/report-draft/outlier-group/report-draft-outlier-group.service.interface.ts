import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { OutlierGroupChangeDataDto } from '../sync/dto/change-outlier-group.dto'
import { DraftOutlierGroupDto } from './dto/draft-outlier-group.dto'
import { EmployeeOutlierGroupDto } from './dto/employee-outlier-group.dto'

/**
 * Outlier groups (the improvement-plan explanation buckets) of a DRAFT report
 * and per-employee group membership. Applicant-facing reads go through the
 * draft ownership resolver; everything the sync batch uses — its appliers and
 * the reads they are driven from — takes an already-resolved draft (`report`),
 * so the whole batch shares one ownership check and one transaction. Outliers
 * themselves are derived (see the analysis service); a member must be a
 * currently-detected outlier.
 */
export interface IReportDraftOutlierGroupService {
  listGroups(
    providerId: string,
    company: CompanyDto,
  ): Promise<DraftOutlierGroupDto[]>

  /** Upsert an outlier group from a sync CREATE command (client-minted id). */
  createGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void>

  /** Patch an outlier group from a sync UPDATE command. */
  updateGroup(
    report: ReportModel,
    id: string,
    data: OutlierGroupChangeDataDto,
  ): Promise<void>

  /** Remove an outlier group from a sync REMOVE command. */
  removeGroup(report: ReportModel, id: string): Promise<void>

  getEmployeeGroup(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<EmployeeOutlierGroupDto>

  /**
   * Set an employee's outlier-group membership from a sync command. Resolves
   * `false` without writing when the employee is not in `detectedIds`.
   */
  setEmployeeGroup(
    report: ReportModel,
    employeeId: string,
    groupId: string,
    detectedIds: Set<string>,
  ): Promise<boolean>

  /** Clear an employee's outlier-group membership from a sync command. */
  clearEmployeeGroup(report: ReportModel, employeeId: string): Promise<void>

  /** The report's employees that currently sit in an outlier group. */
  getMemberEmployeeIds(report: ReportModel): Promise<string[]>

  /** Bulk-clear membership for the given employees of the report (no 404). */
  clearEmployeeGroups(report: ReportModel, employeeIds: string[]): Promise<void>
}

export const IReportDraftOutlierGroupService = Symbol(
  'IReportDraftOutlierGroupService',
)
