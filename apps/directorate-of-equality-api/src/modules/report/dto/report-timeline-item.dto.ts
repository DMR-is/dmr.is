import { ApiDateTime, ApiEnum, ApiOptionalDto } from '@dmr.is/decorators'

import { ReportCommentDto } from '../../report-comment/dto/report-comment.dto'
import { ReportEventDto } from './report-event.dto'

export enum ReportTimelineItemKindEnum {
  EVENT = 'EVENT',
  COMMENT = 'COMMENT',
}

export class ReportTimelineItemDto {
  @ApiEnum(ReportTimelineItemKindEnum, {
    enumName: 'ReportTimelineItemKindEnum',
  })
  kind!: ReportTimelineItemKindEnum

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDto(ReportEventDto, { nullable: true })
  event!: ReportEventDto | null

  @ApiOptionalDto(ReportCommentDto, { nullable: true })
  comment!: ReportCommentDto | null
}
