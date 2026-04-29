import { CompanyDto } from '../company/dto/company.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateEqualityReportDto } from '../report-create/dto/create-equality-report.dto'
import { CreateReportDto } from '../report-create/dto/create-report.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from './dto/salary-analysis.response.dto'

export interface IApplicationService {
  salaryAnalysis(
    input: SalaryAnalysisRequestDto,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto>
  submitSalary(
    input: CreateReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto>
  submitEquality(
    input: CreateEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto>
  getActiveEqualityReport(company: CompanyDto): Promise<EqualityReportSummaryDto>
  getReport(
    reportId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
}

export const IApplicationService = Symbol('IApplicationService')
