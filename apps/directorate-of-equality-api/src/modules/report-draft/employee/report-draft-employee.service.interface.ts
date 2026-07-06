import { PagingQuery } from '@dmr.is/shared-dto'

import { CompanyDto } from '../../company/dto/company.dto'
import { ReportModel } from '../../report/models/report.model'
import { EmployeeChangeDataDto } from '../sync/dto/change-employee.dto'
import { GetDraftEmployeesResponseDto } from './dto/get-draft-employees-response.dto'

/**
 * Employees of a DRAFT report. Reads go through the draft ownership resolver;
 * writes are sync appliers that take an already-resolved draft (`report`). A
 * created employee carries a server-assigned `ordinal` (handed out by the sync
 * service from `getMaxOrdinal`) and a NULL `score` (derived and frozen at
 * submit).
 */
export interface IReportDraftEmployeeService {
  listEmployees(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetDraftEmployeesResponseDto>

  /** Highest ordinal currently in the report (0 if empty). */
  getMaxOrdinal(report: ReportModel): Promise<number>

  /** Upsert an employee from a sync CREATE command (client-minted id + ordinal). */
  createEmployee(
    report: ReportModel,
    id: string,
    data: EmployeeChangeDataDto,
    ordinal: number,
  ): Promise<void>

  /** Patch an employee from a sync UPDATE command. */
  updateEmployee(
    report: ReportModel,
    id: string,
    data: EmployeeChangeDataDto,
  ): Promise<void>

  /** Remove an employee (and its personal step + outlier rows) from a REMOVE. */
  removeEmployee(report: ReportModel, id: string): Promise<void>
}

export const IReportDraftEmployeeService = Symbol('IReportDraftEmployeeService')
