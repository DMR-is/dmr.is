import { Max, Min } from 'class-validator'

import {
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import {
  MAX_PAID_HOURS_PER_MONTH,
  MIN_PAID_HOURS_PER_MONTH,
} from '../../../constants'
import { GenderEnum } from '../../../report/models/report.enums'

/**
 * Patch body for one draft employee. Every field optional (PATCH): omitted
 * keys are left untouched, an explicit `null` clears a nullable salary
 * sub-component. `reportEmployeeRoleId`, when given, must point at a role on
 * the same draft. `ordinal` and `score` are never client-set.
 */
export class UpdateDraftEmployeeDto {
  @ApiOptionalUUID()
  reportEmployeeRoleId?: string

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender?: GenderEnum

  @ApiOptionalString()
  field?: string

  @ApiOptionalString()
  department?: string

  @ApiOptionalString({ description: 'Employment start date (YYYY-MM-DD).' })
  startDate?: string

  @ApiOptionalNumber({
    description:
      'Greiddar stundir í mánuðinum, fastar yfirvinnustundir meðtaldar en ekki tilfallandi greiddar stundir. Nefnari reglulegs tímakaups.',
    minimum: MIN_PAID_HOURS_PER_MONTH,
    maximum: MAX_PAID_HOURS_PER_MONTH,
  })
  @Min(MIN_PAID_HOURS_PER_MONTH)
  @Max(MAX_PAID_HOURS_PER_MONTH)
  paidHours?: number

  @ApiOptionalNumber()
  baseSalary?: number

  // ── Viðbótarlaun — fastar greiðslur aðrar en grunnlaun (Launagögn J–L) ──
  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedOther?: number | null

  // ── Aukagreiðslur — tilfallandi greiðslur (Launagögn M–O). Reported
  //    on their own; NOT part of regluleg laun or reglulegt tímakaup. ──
  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOther?: number | null
}
