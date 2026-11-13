import { PagingQuery } from '@dmr.is/shared-dto'

import { CompanyDto } from '../company/dto/company.dto'
import { PresignUploadResponseDto } from '../import-upload/dto/presign-upload-response.dto'
import { EqualityReportSummaryDto } from '../report/dto/equality-report-summary.dto'
import { ReportTypeEnum } from '../report/models/report.enums'
import { EqualityContentPdf } from '../report/report.service.interface'
import {
  AddReportAttachmentDto,
  PresignReportAttachmentDto,
} from '../report-attachment/dto/add-report-attachment.dto'
import {
  GetReportAttachmentsResponseDto,
  ReportAttachmentDto,
} from '../report-attachment/dto/report-attachment.dto'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from '../report-statistics/dto/salary-analysis.response.dto'
import { ApplicationReportCommentDto } from './dto/application-report-comment.dto'
import { ApplicationReportDetailDto } from './dto/application-report-detail.dto'
import { EditEqualityContentDto } from './dto/edit-equality-content.dto'
import { EditOutliersDto } from './dto/edit-outliers.dto'
import { SalaryReportEligibilityDto } from './dto/salary-report-eligibility.dto'
import { GetSubCriterionCatalogResponseDto } from './dto/sub-criterion-catalog.dto'
import { SubmitApplicationReportCommentDto } from './dto/submit-application-report-comment.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import {
  SubmitEqualityOptions,
  SubmitSalaryOptions,
  SubmitSalaryReportInput,
} from './dto/submit-partner-salary-report.dto'

export interface IApplicationService {
  salaryAnalysis(
    input: SalaryAnalysisRequestDto,
    company: CompanyDto,
  ): Promise<SalaryAnalysisResponseDto>
  submitSalary(
    input: SubmitSalaryReportInput,
    company: CompanyDto,
    options?: SubmitSalaryOptions,
  ): Promise<CreateReportResponseDto>
  submitEquality(
    input: SubmitEqualityReportDto,
    company: CompanyDto,
    options?: SubmitEqualityOptions,
  ): Promise<CreateReportResponseDto>
  /**
   * The replay a submission with this caller's `providerId` would get, or
   * null. Lets a channel answer a replay before reading the body.
   */
  findReplay(
    providerId: string,
    company: CompanyDto,
    type: ReportTypeEnum,
  ): Promise<CreateReportResponseDto | null>
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
  /**
   * The applicant's own uploaded equality plan, read back.
   *
   * Needed during a correction: the applicant is being asked to revise a plan
   * they can no longer see, because the detail read withholds the PDF bytes.
   * Scoped by the same provider/company tuple as every other read here, so a
   * company can only fetch its own.
   */
  getEqualityContentPdf(
    providerId: string,
    company: CompanyDto,
  ): Promise<EqualityContentPdf>
  getReportOutliers(
    providerId: string,
    company: CompanyDto,
    query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto>
  getReportComments(
    providerId: string,
    company: CompanyDto,
  ): Promise<ApplicationReportCommentDto[]>
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
  /**
   * Fylgiskjöl on the company's own equality report, while it is a DRAFT or
   * IN_REVIEW. Ownership is resolved here; the rules live in
   * `IReportAttachmentService`.
   */
  presignEqualityAttachment(
    providerId: string,
    input: PresignReportAttachmentDto,
    company: CompanyDto,
  ): Promise<PresignUploadResponseDto>
  addEqualityAttachment(
    providerId: string,
    input: AddReportAttachmentDto,
    company: CompanyDto,
  ): Promise<ReportAttachmentDto>
  listEqualityAttachments(
    providerId: string,
    company: CompanyDto,
  ): Promise<GetReportAttachmentsResponseDto>
  removeEqualityAttachment(
    providerId: string,
    attachmentId: string,
    company: CompanyDto,
  ): Promise<void>
  editOutliers(
    providerId: string,
    input: EditOutliersDto,
    company: CompanyDto,
  ): Promise<ApplicationReportDetailDto>
  withdraw(providerId: string, company: CompanyDto): Promise<void>
  getEqualityTemplateHtml(): string
  getEqualityTemplateDocx(): Buffer
  getSubCriterionCatalog(): GetSubCriterionCatalogResponseDto
}

export const IApplicationService = Symbol('IApplicationService')
