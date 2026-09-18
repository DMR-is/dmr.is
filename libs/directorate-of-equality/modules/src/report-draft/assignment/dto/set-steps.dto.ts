import { IsUUID } from 'class-validator'

import { ApiArray } from '@dmr.is/decorators'

/**
 * Replace-all body for an owner's (role or employee) step assignments. The
 * full set of step ids replaces whatever was assigned before; an empty array
 * clears all assignments. Every id must be a step belonging to the same draft.
 */
export class SetStepsDto {
  @ApiArray({
    type: [String],
    description: 'Full set of step ids assigned to this owner (replace-all).',
  })
  @IsUUID(undefined, { each: true })
  stepIds!: string[]
}
