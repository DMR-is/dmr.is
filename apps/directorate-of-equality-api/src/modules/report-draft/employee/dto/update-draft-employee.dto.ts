import {
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../../report/models/report.enums'
import { EducationEnum } from '../../../report-employee/models/report-employee.model'

/**
 * Patch body for one draft employee. Every field optional (PATCH): omitted
 * keys are left untouched, an explicit `null` clears a nullable salary
 * sub-component. `reportEmployeeRoleId`, when given, must point at a role on
 * the same draft. `ordinal` and `score` are never client-set.
 */
export class UpdateDraftEmployeeDto {
  @ApiOptionalUUID()
  reportEmployeeRoleId?: string

  @ApiOptionalEnum(EducationEnum, { enumName: 'EducationEnum' })
  education?: EducationEnum

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender?: GenderEnum

  @ApiOptionalString()
  field?: string

  @ApiOptionalString()
  department?: string

  @ApiOptionalString({ description: 'Employment start date (YYYY-MM-DD).' })
  startDate?: string

  @ApiOptionalNumber()
  workRatio?: number

  @ApiOptionalNumber()
  baseSalary?: number

  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusPayments?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOther?: number | null
}
