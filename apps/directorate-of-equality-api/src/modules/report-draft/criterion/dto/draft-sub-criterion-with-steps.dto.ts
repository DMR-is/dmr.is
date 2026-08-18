import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportSubCriterionDto } from '../../../report-criterion/dto/report-sub-criterion.dto'
import { ReportSubCriterionStepDto } from '../../../report-criterion/dto/report-sub-criterion-step.dto'

/** A draft sub-criterion with its scoring steps inlined, ordered by `order`. */
export class DraftSubCriterionWithStepsDto extends ReportSubCriterionDto {
  @ApiDtoArray(ReportSubCriterionStepDto, {
    description:
      'The sub-criterion\'s scoring steps, ordered by `order` ascending. Empty when no steps have been defined yet.',
  })
  steps!: ReportSubCriterionStepDto[]
}
