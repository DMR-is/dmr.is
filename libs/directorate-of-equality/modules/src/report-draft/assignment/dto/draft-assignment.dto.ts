import { ApiArray } from '@dmr.is/decorators'

/** The step ids currently assigned to an owner (role or employee) on a draft. */
export class DraftAssignmentDto {
  @ApiArray({ type: [String], description: 'Assigned step ids.' })
  stepIds!: string[]
}
