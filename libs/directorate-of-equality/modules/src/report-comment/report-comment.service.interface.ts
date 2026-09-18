import { type ReportResourceContext } from '../report/types/report-resource-context'
import { CreateReportCommentDto } from './dto/create-report-comment.dto'
import { ReportCommentDto } from './dto/report-comment.dto'

export interface IReportCommentService {
  getByReportId(context: ReportResourceContext): Promise<ReportCommentDto[]>
  create(
    context: ReportResourceContext,
    dto: CreateReportCommentDto,
  ): Promise<ReportCommentDto>
  delete(context: ReportResourceContext, commentId: string): Promise<void>
}

export const IReportCommentService = Symbol('IReportCommentService')
