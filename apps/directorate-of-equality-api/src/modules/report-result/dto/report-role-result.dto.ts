import { ApiNumber, ApiUUId } from '@dmr.is/decorators'

export class ReportRoleResultDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportResultId!: string

  @ApiUUId()
  reportEmployeeRoleId!: string

  @ApiNumber()
  averageSalary!: number

  @ApiNumber()
  minimumSalary!: number

  @ApiNumber()
  maximumSalary!: number

  @ApiNumber()
  medianSalary!: number

  @ApiNumber()
  averageMaleSalary!: number

  @ApiNumber()
  averageFemaleSalary!: number

  @ApiNumber()
  averageNeutralSalary!: number

  @ApiNumber()
  minimumMaleSalary!: number

  @ApiNumber()
  minimumFemaleSalary!: number

  @ApiNumber()
  minimumNeutralSalary!: number

  @ApiNumber()
  maximumMaleSalary!: number

  @ApiNumber()
  maximumFemaleSalary!: number

  @ApiNumber()
  maximumNeutralSalary!: number
}
