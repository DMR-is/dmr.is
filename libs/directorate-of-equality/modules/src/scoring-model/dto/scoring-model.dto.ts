import {
  ApiDto,
  ApiDtoArray,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { ScoringCriterionDto } from './scoring-criterion.dto'
import { ScoringModelValidationDto } from './scoring-validation.dto'

export class ScoringRoleStepAssignmentDto {
  @ApiUUId()
  subCriterionId!: string

  @ApiUUId()
  stepId!: string
}

export class ScoringRoleDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiDtoArray(ScoringRoleStepAssignmentDto)
  stepAssignments!: ScoringRoleStepAssignmentDto[]
}

export class ScoringModelSummaryDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string
}

export class ScoringModelDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiDtoArray(ScoringCriterionDto)
  criteria!: ScoringCriterionDto[]

  @ApiDtoArray(ScoringRoleDto)
  roles!: ScoringRoleDto[]

  @ApiDto(ScoringModelValidationDto)
  validation!: ScoringModelValidationDto
}

export class GetScoringModelsResponseDto {
  @ApiDtoArray(ScoringModelSummaryDto)
  models!: ScoringModelSummaryDto[]
}

export class CreateScoringModelDto {
  @ApiString({ minLength: 1 })
  name!: string
}
