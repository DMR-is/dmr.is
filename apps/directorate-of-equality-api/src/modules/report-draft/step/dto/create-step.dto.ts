import { ApiNumber, ApiString } from '@dmr.is/decorators'

/** Body for creating a scoring step under a sub-criterion on a draft. */
export class CreateStepDto {
  @ApiNumber({ description: 'Ordering position of the step within its sub-criterion.' })
  order!: number

  @ApiString()
  description!: string

  @ApiNumber({ description: 'Score awarded when this step applies.' })
  score!: number
}
