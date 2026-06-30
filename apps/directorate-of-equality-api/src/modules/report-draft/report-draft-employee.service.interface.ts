import { PagingQuery } from '@dmr.is/shared-dto'

import { CompanyDto } from '../company/dto/company.dto'
import { ReportEmployeeDto } from '../report-employee/dto/report-employee.dto'
import { CreateDraftEmployeeDto } from './dto/create-draft-employee.dto'
import { GetDraftEmployeesResponseDto } from './dto/get-draft-employees-response.dto'
import { UpdateDraftEmployeeDto } from './dto/update-draft-employee.dto'

/**
 * CRUD for the employees of a DRAFT report. Every operation is gated through
 * the draft ownership resolver. A created employee carries a server-assigned
 * `ordinal` and a NULL `score` (scores are derived and frozen at submit).
 */
export interface IReportDraftEmployeeService {
  listEmployees(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetDraftEmployeesResponseDto>

  createEmployee(
    providerId: string,
    company: CompanyDto,
    input: CreateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto>

  updateEmployee(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
    input: UpdateDraftEmployeeDto,
  ): Promise<ReportEmployeeDto>

  deleteEmployee(
    providerId: string,
    company: CompanyDto,
    employeeId: string,
  ): Promise<void>
}

export const IReportDraftEmployeeService = Symbol('IReportDraftEmployeeService')
