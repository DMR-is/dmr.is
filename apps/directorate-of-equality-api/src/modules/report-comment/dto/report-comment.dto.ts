import {
  ApiDateTime,
  ApiEnum,
  ApiOptionalString,
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

  @ApiOptionalString({
    nullable: true,
    description:
      'Full name of the authoring reviewer. Null for company-authored comments (no individual person).',
  })
  authorName!: string | null

  @ApiEnum(CommentVisibilityEnum, { enumName: 'CommentVisibilityEnum' })
  visibility!: CommentVisibilityEnum

  @ApiString({ description: 'Plain text comment body' })
  body!: string

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  reportStatus!: ReportStatusEnum

  @ApiDateTime()
  createdAt!: Date
}
