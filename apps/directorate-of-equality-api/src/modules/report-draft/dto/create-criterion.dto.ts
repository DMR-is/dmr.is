import { ApiEnum, ApiNumber, ApiString } from '@dmr.is/decorators'

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

/** Body for creating a top-level criterion on a draft. */
export class CreateCriterionDto {
  @ApiString({ minLength: 1 })
  title!: string

  @ApiNumber({ description: 'Relative weight of this criterion.' })
  weight!: number

  @ApiString()
  description!: string

  @ApiEnum(ReportCriterionTypeEnum, { enumName: 'ReportCriterionTypeEnum' })
  type!: ReportCriterionTypeEnum
}
