import {
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
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

export class UpdateScoringCriterionDto {
  @ApiEnum(ReportCriterionTypeEnum, {
    enumName: 'ReportCriterionTypeEnum',
    required: false,
  })
  type?: ReportCriterionTypeEnum

  @ApiString({ minLength: 1, required: false })
  title?: string

  @ApiString({ minLength: 1, required: false })
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

  @ApiDto(ScoringModelValidationDto)
  validation!: ScoringModelValidationDto
}

export class ScoringCriterionResponseDto {
  @ApiDto(ScoringCriterionDto)
  criterion!: ScoringCriterionDto

  @ApiDto(ScoringModelValidationDto)
  validation!: ScoringModelValidationDto
}
