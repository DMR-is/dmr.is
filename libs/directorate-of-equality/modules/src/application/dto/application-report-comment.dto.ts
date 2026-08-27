import { ApiDateTime, ApiEnum, ApiString, ApiUUId } from '@dmr.is/decorators'

import { ReportRoleEnum } from '../../report/types/report-resource-context'
import { ReportCommentDto } from '../../report-comment/dto/report-comment.dto'

export class ApplicationReportCommentDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportRoleEnum, { enumName: 'ReportRoleEnum' })
  authorKind!: ReportRoleEnum

  @ApiString({ description: 'Plain text comment body' })
  body!: string

  @ApiDateTime()
  createdAt!: Date

  static fromReportComment(
    comment: ReportCommentDto,
  ): ApplicationReportCommentDto {
    return {
      id: comment.id,
      authorKind: comment.authorKind,
      body: comment.body,
      createdAt: comment.createdAt,
    }
  }
}
