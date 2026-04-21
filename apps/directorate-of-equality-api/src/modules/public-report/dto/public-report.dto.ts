import { ApiDateTime, ApiNumber, ApiString, ApiUUId } from '@dmr.is/decorators'

export class PublicReportDto {
  @ApiUUId()
  id!: string

  @ApiString()
  sizeBucket!: string

  @ApiString()
  isatCategory!: string

  @ApiDateTime()
  publishedAt!: Date

  @ApiDateTime()
  validUntil!: Date

  @ApiNumber()
  averageMaleSalary!: number

  @ApiNumber()
  averageFemaleSalary!: number

  @ApiNumber()
  averageNeutralSalary!: number

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
}
