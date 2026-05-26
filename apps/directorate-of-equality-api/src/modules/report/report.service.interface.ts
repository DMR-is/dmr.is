import { PagingQuery } from '@dmr.is/shared-dto'

import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { ReportOverviewDto } from './dto/report-overview.dto'
import { ReportOverviewStatisticsDto } from './dto/report-overview-statistics.dto'

export interface IReportService {
  list(query: GetReportsQueryDto): Promise<GetReportsResponseDto>
  getById(id: string): Promise<ReportDetailDto>
  getOutliers(
    reportId: string,
    query: PagingQuery,
  ): Promise<GetReportOutliersResponseDto>
  getActiveEqualityForCompany(
    companyId: string,
  ): Promise<EqualityReportSummaryDto | null>
  getOverview(nationalId: string): Promise<ReportOverviewDto>
  getOverviewStatistics(): Promise<ReportOverviewStatisticsDto>
}

export const IReportService = Symbol('IReportService')
