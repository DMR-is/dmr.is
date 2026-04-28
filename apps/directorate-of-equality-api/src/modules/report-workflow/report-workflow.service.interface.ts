import { type ReportResourceContext } from '../report/types/report-resource-context'
import { DenyReportDto } from './dto/deny-report.dto'

export interface IReportWorkflowService {
  assign(context: ReportResourceContext): Promise<void>
  deny(context: ReportResourceContext, dto: DenyReportDto): Promise<void>
  approve(context: ReportResourceContext): Promise<void>
  startFines(context: ReportResourceContext): Promise<void>
}

export const IReportWorkflowService = Symbol('IReportWorkflowService')
