import {
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { ScoringSubCriterionDto } from './scoring-sub-criterion.dto'
import { ScoringModelValidationDto } from './scoring-validation.dto'

export class ScoringCriterionDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportCriterionTypeEnum, { enumName: 'ReportCriterionTypeEnum' })
  type!: ReportCriterionTypeEnum

  @ApiString()
  title!: string

  @ApiString()
  description!: string

  @ApiNumber({
    description:
      'Derived, never stored: the sum of this criterion’s own sub-criteria weights. A criterion weight reaches no score — only sub-criterion weights do — so storing it separately could only disagree with the figures that count.',
  })
  weight!: number

  @ApiDtoArray(ScoringSubCriterionDto)
  subCriteria!: ScoringSubCriterionDto[]
}

export class CreateScoringCriterionDto {
  @ApiEnum(ReportCriterionTypeEnum, { enumName: 'ReportCriterionTypeEnum' })
  type!: ReportCriterionTypeEnum

  @ApiString({ minLength: 1 })
  title!: string

  @ApiString({ minLength: 1 })
  description!: string
}

/**
 * PATCH semantics: an omitted key is left alone, never cleared. The fields use
 * the `ApiOptional*` decorators rather than `required: false`, which only
 * relaxes the published document — class-validator still refuses the request.
 */
export class UpdateScoringCriterionDto {
  @ApiOptionalEnum(ReportCriterionTypeEnum, {
    enumName: 'ReportCriterionTypeEnum',
  })
  type?: ReportCriterionTypeEnum

  @ApiOptionalString({ minLength: 1 })
  title?: string

  @ApiOptionalString({ minLength: 1 })
  description?: string
}

/**
 * Every criterion in the model, with the model's current validity beside it.
 *
 * The validity travels with every read and every write so a caller never has to
 * ask a second time what a change did — "weights now sum to 110" arrives on the
 * response that caused it.
 */
export class GetScoringCriteriaResponseDto {
  @ApiDtoArray(ScoringCriterionDto)
  criteria!: ScoringCriterionDto[]

  @ApiDto(ScoringModelValidationDto, {
    description:
      'The whole model’s validity, not this list’s — the weight rules are global, so a change to one criterion can be what makes another part of the model add up.',
  })
  validation!: ScoringModelValidationDto
}

export class ScoringCriterionResponseDto {
  @ApiDto(ScoringCriterionDto)
  criterion!: ScoringCriterionDto

  @ApiDto(ScoringModelValidationDto)
  validation!: ScoringModelValidationDto
}
