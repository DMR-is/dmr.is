import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportCriterionDto } from '../../../report-criterion/dto/report-criterion.dto'
import { DraftSubCriterionWithStepsDto } from './draft-sub-criterion-with-steps.dto'

/** A draft criterion with its sub-criteria (each carrying their steps) inlined. */
export class DraftCriterionWithSubCriteriaDto extends ReportCriterionDto {
  @ApiDtoArray(DraftSubCriterionWithStepsDto, {
    description:
      'The criterion\'s sub-criteria in creation order, each with its scoring steps. Empty when none have been defined yet.',
  })
  subCriteria!: DraftSubCriterionWithStepsDto[]
}
