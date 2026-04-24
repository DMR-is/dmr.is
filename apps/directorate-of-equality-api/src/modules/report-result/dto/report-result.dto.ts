import { ApiNumber, ApiOptionalNumber, ApiUUId } from '@dmr.is/decorators'

export class ReportResultDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiNumber()
  averageMaleSalary!: number

  @ApiNumber()
  averageFemaleSalary!: number

  @ApiNumber()
  averageNeutralSalary!: number

  @ApiNumber()
  averageSalary!: number

  @ApiNumber()
  minimumSalary!: number

  @ApiNumber()
  maximumSalary!: number

  @ApiNumber()
  medianSalary!: number

  @ApiNumber()
  salaryDifferenceMaleFemale!: number

  @ApiNumber()
  salaryDifferenceMaleNeutral!: number

  @ApiNumber()
  salaryDifferenceFemaleMale!: number

  @ApiNumber()
  salaryDifferenceFemaleNeutral!: number

  @ApiNumber()
  salaryDifferenceNeutralMale!: number

  @ApiNumber()
  salaryDifferenceNeutralFemale!: number

  @ApiOptionalNumber({ nullable: true })
  salaryDifferenceThresholdPercent!: number | null
}
