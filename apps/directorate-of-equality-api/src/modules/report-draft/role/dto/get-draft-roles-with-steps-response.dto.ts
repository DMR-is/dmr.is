import { ApiDtoArray } from '@dmr.is/decorators'

import { DraftRoleWithStepsDto } from './draft-role-with-steps.dto'

/**
 * The draft's roles with their step assignments (small, unpaginated set —
 * bounded by `MAX_ROLES`).
 */
export class GetDraftRolesWithStepsResponseDto {
  @ApiDtoArray(DraftRoleWithStepsDto)
  roles!: DraftRoleWithStepsDto[]
}
