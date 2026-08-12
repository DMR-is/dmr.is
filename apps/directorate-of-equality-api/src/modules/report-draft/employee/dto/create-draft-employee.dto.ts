import {
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../../report/models/report.enums'

/**
 * Body for adding one employee to a draft. `ordinal` is assigned server-side
 * (next free in the report) and `score` is left NULL — it is derived from step
 * assignments and only computed at submit. The role must already exist on the
 * same draft (`reportEmployeeRoleId`).
 */
export class CreateDraftEmployeeDto {
  @ApiUUId({ description: 'Id of a role already defined on this draft.' })
  reportEmployeeRoleId!: string

  @ApiEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender!: GenderEnum

  @ApiOptionalString({ nullable: true })
  field?: string | null

  @ApiOptionalString({ nullable: true })
  department?: string | null

  @ApiString({ description: 'Employment start date (YYYY-MM-DD).' })
  startDate!: string

  @ApiNumber()
  workRatio!: number

  @ApiNumber()
  baseSalary!: number

  // ── Viðbótarlaun (additional salary) sub-components ──
  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance?: number | null

  // ── Aukagreiðslur (bonus salary) sub-components ──
  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusPayments?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOther?: number | null
}
