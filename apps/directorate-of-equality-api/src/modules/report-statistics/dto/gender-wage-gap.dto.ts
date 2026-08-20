import { ApiNumber, ApiOptionalNumber } from '@dmr.is/decorators'

export class GenderWageGapDto {
  @ApiNumber()
  maleAverageSalary!: number

  @ApiNumber()
  femaleAverageSalary!: number

  @ApiNumber()
  overallAverageSalary!: number

  @ApiNumber()
  maleMedianSalary!: number

  @ApiNumber()
  femaleMedianSalary!: number

  @ApiNumber()
  overallMedianSalary!: number

  @ApiOptionalNumber({ nullable: true })
  averageWageGapPercent!: number | null

  @ApiNumber()
  maleCount!: number

  @ApiNumber()
  femaleCount!: number
}
