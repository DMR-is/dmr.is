import { ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

export class ReportSubCriterionStepDto {
  @ApiUUId()
  id!: string

  @ApiNumber()
  order!: number

  @ApiString()
  description!: string

  @ApiUUId()
  reportSubCriterionId!: string

  @ApiNumber()
  score!: number
}
