import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportSubCriterionDto } from '../../../report-criterion/dto/report-sub-criterion.dto'

/** The sub-criteria of one criterion on a draft. */
export class GetDraftSubCriteriaResponseDto {
  @ApiDtoArray(ReportSubCriterionDto)
  subCriteria!: ReportSubCriterionDto[]
}
