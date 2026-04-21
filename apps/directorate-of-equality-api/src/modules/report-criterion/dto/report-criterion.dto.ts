import { ApiEnum, ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../models/report-criterion.model'

export class ReportCriterionDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiNumber()
  weight!: number

  @ApiString()
  description!: string

  @ApiEnum(ReportCriterionTypeEnum, { enumName: 'ReportCriterionTypeEnum' })
  type!: ReportCriterionTypeEnum

  @ApiUUId()
  reportId!: string
}
