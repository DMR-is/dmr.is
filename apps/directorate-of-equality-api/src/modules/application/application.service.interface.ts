import { CompanyDto } from '../company/dto/company.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from './dto/salary-analysis.response.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'

export interface IApplicationService {
  salaryAnalysis(
    input: SalaryAnalysisRequestDto,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto>
  submitSalary(
    input: SubmitSalaryReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto>
  submitEquality(
    input: SubmitEqualityReportDto,
    company: CompanyDto,
  ): Promise<CreateReportResponseDto>
  getActiveEqualityReport(company: CompanyDto): Promise<EqualityReportSummaryDto>
  getReport(
    reportId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
}

export const IApplicationService = Symbol('IApplicationService')
