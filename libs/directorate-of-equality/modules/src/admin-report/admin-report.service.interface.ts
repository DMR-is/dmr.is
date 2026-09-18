import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from '../report-statistics/dto/salary-analysis.response.dto'
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

  analyzeSalary(
    companyId: string,
    dto: SalaryAnalysisRequestDto,
  ): Promise<SalaryAnalysisResponseDto>
}

export const IAdminReportService = Symbol('IAdminReportService')
