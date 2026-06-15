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

  // ── Viðbótarlaun (additional salary) sub-components ──
  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime!: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance!: number | null

  // ── Aukagreiðslur (bonus salary) sub-components ──
  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance!: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime!: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusPayments!: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOther!: number | null

  // ── Derived parents (computed = sum of children, each null treated as 0) ──
  @ApiNumber()
  additionalSalary!: number

  @ApiNumber()
  bonusSalary!: number

  @ApiEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender!: GenderEnum

  @ApiUUId()
  reportEmployeeRoleId!: string

  @ApiUUId()
  reportId!: string

  @ApiNumber()
  score!: number
}
