import { ApiDtoArray } from '@dmr.is/decorators'

import { DraftOutlierGroupDto } from './draft-outlier-group.dto'

/** The outlier groups defined on a draft, each with its member employee ids. */
export class GetDraftOutlierGroupsResponseDto {
  @ApiDtoArray(DraftOutlierGroupDto)
  groups!: DraftOutlierGroupDto[]
}
