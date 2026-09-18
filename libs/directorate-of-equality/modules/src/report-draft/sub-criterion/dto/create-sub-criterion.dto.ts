import { ApiNumber, ApiString } from '@dmr.is/decorators'

/** Body for creating a sub-criterion under a criterion on a draft. */
export class CreateSubCriterionDto {
  @ApiString({ minLength: 1 })
  title!: string

  @ApiString()
  description!: string

  @ApiNumber({ description: 'Relative weight of this sub-criterion.' })
  weight!: number
}
