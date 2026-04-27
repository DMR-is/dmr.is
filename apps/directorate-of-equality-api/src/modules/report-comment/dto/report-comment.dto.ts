import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportStatusEnum } from '../../report/models/report.model'
import { ReportRoleEnum } from '../../report/types/report-resource-context'
import { CommentVisibilityEnum } from '../models/report-comment.model'

export class ReportCommentDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiEnum(ReportRoleEnum, {
    enumName: 'ReportRoleEnum',
  })
  authorKind!: ReportRoleEnum

  @ApiOptionalUuid({ nullable: true })
  authorUserId!: string | null

  @ApiEnum(CommentVisibilityEnum, { enumName: 'CommentVisibilityEnum' })
  visibility!: CommentVisibilityEnum

  @ApiString()
  body!: string

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  reportStatus!: ReportStatusEnum

  @ApiDateTime()
  createdAt!: Date
}
