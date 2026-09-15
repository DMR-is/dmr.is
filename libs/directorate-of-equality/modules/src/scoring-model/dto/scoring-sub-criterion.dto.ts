import { Max, Min } from 'class-validator'

import {
  ApiDtoArray,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

/**
 * Why `weight` carries `@Min(0) @Max(100)` in both DTOs below.
 *
 * `@ApiNumber` is `IsNumber()` and nothing else, and every weight rule — here
 * and in the filing gate — compares only the **sum** against 100. So `60, 60,
 * -20` totals 100, reports VALID, and emits negative step scores:
 * `computeStepScore` is an unguarded `(order / numSteps) * weight *
 * SCORE_FACTOR`, so a negative weight inverts its sub-criterion's scale and a
 * higher þrep scores lower. That reaches `computeEmployeeScores`, which is an
 * employee's x-coordinate in the wage-gap regression, with nothing raised
 * anywhere. A per-value bound is the only thing that can catch it; a sum check
 * never will.
 *
 * The upper bound also turns `weight: 100` — legal, when a model has one
 * sub-criterion — from a `NUMERIC` overflow 500 into a 400, alongside the
 * column widening in `m-20260915-scoring-weight-precision`.
 */

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

  @ApiNumber({ minimum: 0, maximum: 100 })
  @Min(0)
  @Max(100)
  weight!: number
}

/**
 * PATCH semantics: an omitted key is left alone, never cleared. The fields use
 * the `ApiOptional*` decorators rather than `required: false`, which only
 * relaxes the published document — class-validator still refuses the request.
 */
export class UpdateScoringSubCriterionDto {
  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalString({ minLength: 1 })
  description?: string

  @ApiOptionalNumber({ minimum: 0, maximum: 100 })
  @Min(0)
  @Max(100)
  weight?: number
}
