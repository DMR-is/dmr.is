import { PagingQuery } from '@dmr.is/shared-dto'

import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import { GetReportOutlierGroupsResponseDto } from './dto/get-report-outlier-groups-response.dto'
import { GetReportOutliersQueryDto } from './dto/get-report-outliers.query.dto'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsForCompanyResponseDto } from './dto/get-reports-for-company-response.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { ReportOverviewDto } from './dto/report-overview.dto'
import { ReportOverviewStatisticsDto } from './dto/report-overview-statistics.dto'
import { ReportModel } from './models/report.model'

/** An uploaded equality plan, decoded and ready to stream. */
export type EqualityContentPdf = {
  pdf: Buffer
  /** The name the company uploaded it under. */
  fileName: string
}

export interface IReportService {
  list(query: GetReportsQueryDto): Promise<GetReportsResponseDto>
  listForCompany(
    companyId: string,
    query: PagingQuery,
  ): Promise<GetReportsForCompanyResponseDto>
  getById(id: string): Promise<ReportDetailDto>
  /**
   * The equality plan PDF a company uploaded, decoded from storage.
   *
   * Separate from `getById` on purpose: the bytes are megabytes and every
   * report read would otherwise carry them, so the detail DTOs expose only
   * `contentType` / `contentFilename` and callers that want the document come
   * here for it.
   *
   * Throws `NotFoundException` unless the report is EQUALITY *and* its content
   * type is PDF — an HTML report has no file to hand back, and saying "not
   * found" is the honest answer for a document that does not exist rather than
   * one the caller may not see.
   */
  getEqualityContentPdf(id: string): Promise<EqualityContentPdf>
  getOutliers(
    reportId: string,
    query: GetReportOutliersQueryDto,
  ): Promise<GetReportOutliersResponseDto>
  getOutlierGroups(reportId: string): Promise<GetReportOutlierGroupsResponseDto>
  getActiveEqualityForCompany(
    companyId: string,
  ): Promise<EqualityReportSummaryDto | null>
  /**
   * The same lookup as above, unmapped. For callers that must resolve the
   * caller-facing `providerId` through their own channel, which needs columns
   * the summary DTO does not carry.
   */
  findActiveEqualityForCompany(companyId: string): Promise<ReportModel | null>
  getOverview(nationalId: string): Promise<ReportOverviewDto>
  getOverviewStatistics(): Promise<ReportOverviewStatisticsDto>
}

export const IReportService = Symbol('IReportService')
