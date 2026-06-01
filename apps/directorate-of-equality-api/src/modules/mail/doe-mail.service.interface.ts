import { ReportModel } from '../report/models/report.model'
import { ReportCommentModel } from '../report-comment/models/report-comment.model'

export interface IDoeMailService {
  sendExternalCommentNotification(
    report: ReportModel,
    comment: ReportCommentModel,
  ): Promise<void>
}

export const IDoeMailService = Symbol('IDoeMailService')
