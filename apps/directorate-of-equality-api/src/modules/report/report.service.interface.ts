import { EqualityReportSummaryDto } from './dto/equality-report-summary.dto'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'

export interface IReportService {
  list(query: GetReportsQueryDto): Promise<GetReportsResponseDto>
  getById(id: string): Promise<ReportDetailDto>
  getActiveEqualityForCompany(
    companyId: string,
  ): Promise<EqualityReportSummaryDto | null>
}

export const IReportService = Symbol('IReportService')
