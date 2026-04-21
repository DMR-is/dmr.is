import {
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'
import { EducationEnum } from '../models/report-employee.model'

export class ReportEmployeeDto {
  @ApiUUId()
  id!: string

  @ApiNumber()
  ordinal!: number

  @ApiEnum(EducationEnum, { enumName: 'EducationEnum' })
  education!: EducationEnum

  @ApiString()
  field!: string

  @ApiString()
  department!: string

  @ApiString()
  startDate!: string

  @ApiNumber()
  workRatio!: number

  @ApiNumber()
  baseSalary!: number

  @ApiNumber()
  additionalSalary!: number

  @ApiOptionalNumber({ nullable: true })
  bonusSalary!: number | null

  @ApiEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender!: GenderEnum

  @ApiUUId()
  reportEmployeeRoleId!: string

  @ApiUUId()
  reportId!: string

  @ApiNumber()
  score!: number
}
