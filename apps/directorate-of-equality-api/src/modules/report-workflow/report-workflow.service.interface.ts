import { type ReportResourceContext } from '../report/types/report-resource-context'
import { AssignReportDto } from './dto/assign-report.dto'
import { DenyReportDto } from './dto/deny-report.dto'
import { SendToEditDto } from './dto/send-to-edit.dto'

export interface IReportWorkflowService {
  assign(context: ReportResourceContext, dto: AssignReportDto): Promise<void>
  deny(context: ReportResourceContext, dto: DenyReportDto): Promise<void>
  approve(context: ReportResourceContext): Promise<void>
  sendToEdit(
    context: ReportResourceContext,
    dto: SendToEditDto,
  ): Promise<void>
  openCommunication(context: ReportResourceContext): Promise<void>
  closeCommunication(context: ReportResourceContext): Promise<void>
}

export const IReportWorkflowService = Symbol('IReportWorkflowService')
