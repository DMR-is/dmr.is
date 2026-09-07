import { PagingQuery } from '@dmr.is/shared-dto'

import { ReportModel } from './models/report.model'

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

export interface IReportService {
  list(query: GetReportsQueryDto): Promise<GetReportsResponseDto>
  listForCompany(
    companyId: string,
    query: PagingQuery,
  ): Promise<GetReportsForCompanyResponseDto>
  getById(id: string): Promise<ReportDetailDto>
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
