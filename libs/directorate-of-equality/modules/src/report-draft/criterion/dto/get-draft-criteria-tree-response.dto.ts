import { ApiDtoArray } from '@dmr.is/decorators'

import { DraftCriterionWithSubCriteriaDto } from './draft-criterion-with-sub-criteria.dto'

/**
 * The draft's complete criteria tree — criteria → sub-criteria → steps in one
 * payload. Bounded by `MAX_CRITERIA`, `MAX_TOTAL_SUB_CRITERIA` and `MAX_STEPS`,
 * so it is unpaginated.
 */
export class GetDraftCriteriaTreeResponseDto {
  @ApiDtoArray(DraftCriterionWithSubCriteriaDto)
  criteria!: DraftCriterionWithSubCriteriaDto[]
}
