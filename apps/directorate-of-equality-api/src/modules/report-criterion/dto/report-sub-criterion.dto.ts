import { ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

export class ReportSubCriterionDto {
  @ApiUUId()
  id!: string

  @ApiString()
  title!: string

  @ApiString()
  description!: string

  @ApiNumber()
  weight!: number

  @ApiUUId()
  reportCriterionId!: string
}
