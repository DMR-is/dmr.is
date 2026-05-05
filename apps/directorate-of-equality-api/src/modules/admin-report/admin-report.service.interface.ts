import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { AdminEqualityReportDto } from './dto/admin-equality-report.dto'
import { AdminSalaryReportDto } from './dto/admin-salary-report.dto'

export interface IAdminReportService {
  submitEquality(
    companyId: string,
    dto: AdminEqualityReportDto,
  ): Promise<CreateReportResponseDto>

  submitSalary(
    companyId: string,
    dto: AdminSalaryReportDto,
  ): Promise<CreateReportResponseDto>
}

export const IAdminReportService = Symbol('IAdminReportService')
