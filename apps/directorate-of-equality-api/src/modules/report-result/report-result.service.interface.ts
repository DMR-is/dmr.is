import { ReportResultDto } from './dto/report-result.dto'

export interface IReportResultService {
  getByReportId(reportId: string): Promise<ReportResultDto>
  createForReport(reportId: string): Promise<ReportResultDto>
}

export const IReportResultService = Symbol('IReportResultService')
