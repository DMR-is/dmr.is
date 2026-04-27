import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportStatusEnum } from '../../report/models/report.model'
import {
  CommentAuthorKindEnum,
  CommentVisibilityEnum,
} from '../models/report-comment.model'

export class ReportCommentDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiEnum(CommentAuthorKindEnum, { enumName: 'CommentAuthorKindEnum' })
  authorKind!: CommentAuthorKindEnum

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
