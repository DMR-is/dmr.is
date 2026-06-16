import { ApiDateTime, ApiEnum, ApiOptionalDto } from '@dmr.is/decorators'

import { CompanyCommentDto } from './company-comment.dto'
import { CompanyEventDto } from './company-event.dto'

export enum CompanyTimelineItemKindEnum {
  EVENT = 'EVENT',
  COMMENT = 'COMMENT',
}

export class CompanyTimelineItemDto {
  @ApiEnum(CompanyTimelineItemKindEnum, {
    enumName: 'CompanyTimelineItemKindEnum',
  })
  kind!: CompanyTimelineItemKindEnum

  @ApiDateTime()
  createdAt!: Date

  @ApiOptionalDto(CompanyEventDto, { nullable: true })
  event!: CompanyEventDto | null

  @ApiOptionalDto(CompanyCommentDto, { nullable: true })
  comment!: CompanyCommentDto | null
}
