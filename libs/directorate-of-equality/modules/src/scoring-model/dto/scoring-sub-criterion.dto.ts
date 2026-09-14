import {
  ApiDtoArray,
  ApiNumber,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

export class ScoringSubCriterionStepDto {
  @ApiUUId()
  id!: string

  @ApiNumber({
    description:
      'Position on this sub-criterion’s scale, from 1. Contiguous: the step score is derived from (stepOrder / number of steps), so a gap would put a step above the scale’s own maximum.',
  })
  stepOrder!: number

  @ApiString()
  description!: string
}

export class ScoringSubCriterionDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiString()
  description!: string

  @ApiNumber({
    description:
      'The only weight in the model that reaches a score. Every sub-criterion weight across the whole model sums to 100.',
  })
  weight!: number

  @ApiDtoArray(ScoringSubCriterionStepDto)
  steps!: ScoringSubCriterionStepDto[]
}

export class CreateScoringSubCriterionDto {
  @ApiString({ minLength: 1 })
  title!: string

  @ApiString({ minLength: 1 })
  description!: string

  @ApiNumber()
  weight!: number
}

export class UpdateScoringSubCriterionDto {
  @ApiString({ minLength: 1, required: false })
  title?: string

  @ApiString({ minLength: 1, required: false })
  description?: string

  @ApiNumber({ required: false })
  weight?: number
}
