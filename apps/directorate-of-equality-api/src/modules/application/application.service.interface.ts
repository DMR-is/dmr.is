import { PagingQuery } from '@dmr.is/shared-dto'

import { CompanyDto } from '../company/dto/company.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from '../report-statistics/dto/salary-analysis.response.dto'
import { ApplicationReportCommentDto } from './dto/application-report-comment.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EditEqualityContentDto } from './dto/edit-equality-content.dto'
import { EditOutliersDto } from './dto/edit-outliers.dto'
import { SalaryReportEligibilityDto } from './dto/salary-report-eligibility.dto'
import { SubmitApplicationReportCommentDto } from './dto/submit-application-report-comment.dto'
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
  getActiveEqualityReport(
    company: CompanyDto,
  ): Promise<EqualityReportSummaryDto>
  getSalaryReportEligibility(
    company: CompanyDto,
  ): Promise<SalaryReportEligibilityDto>
  getReport(
    providerId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
  getReportOutliers(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto>
  createReportComment(
    providerId: string,
    input: SubmitApplicationReportCommentDto,
    company: CompanyDto,
  ): Promise<ApplicationReportCommentDto>
  editEqualityContent(
    providerId: string,
    input: EditEqualityContentDto,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
  editOutliers(
    providerId: string,
    input: EditOutliersDto,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
  withdraw(providerId: string, company: CompanyDto): Promise<void>
  getEqualityTemplateHtml(): string
  getEqualityTemplateDocx(): Buffer
}

export const IApplicationService = Symbol('IApplicationService')
