import { ApiDtoArray } from '@dmr.is/decorators'

import { ReportCriterionDto } from '../../../report-criterion/dto/report-criterion.dto'

/** The top-level criteria defined on a draft (sub-criteria via their own endpoint). */
export class GetDraftCriteriaResponseDto {
  @ApiDtoArray(ReportCriterionDto)
  criteria!: ReportCriterionDto[]
}
