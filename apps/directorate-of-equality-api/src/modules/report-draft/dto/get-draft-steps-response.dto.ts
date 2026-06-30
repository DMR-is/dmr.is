import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportSubCriterionStepDto } from '../../report-criterion/dto/report-sub-criterion-step.dto'

/** The scoring steps of one sub-criterion on a draft (ordered). */
export class GetDraftStepsResponseDto {
  @ApiDtoArray(ReportSubCriterionStepDto)
  steps!: ReportSubCriterionStepDto[]
}
