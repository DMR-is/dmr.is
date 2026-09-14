import { Max, Min } from 'class-validator'

import {
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  MAX_PAID_HOURS_PER_MONTH,
  MIN_PAID_HOURS_PER_MONTH,
} from '../../constants'
import { GenderEnum } from '../../report/models/report.model'

export class ReportEmployeeDto {
  @ApiUUId()
  id!: string

  @ApiNumber()
  ordinal!: number

  @ApiOptionalString({ nullable: true })
  field!: string | null

  @ApiOptionalString({ nullable: true })
  department!: string | null

  @ApiString()
  startDate!: string

  @ApiNumber({
    description:
      'Greiddar stundir í mánuðinum, fastar yfirvinnustundir meðtaldar en ekki tilfallandi greiddar stundir. Nefnari reglulegs tímakaups.',
    minimum: MIN_PAID_HOURS_PER_MONTH,
    maximum: MAX_PAID_HOURS_PER_MONTH,
  })
  @Min(MIN_PAID_HOURS_PER_MONTH)
  @Max(MAX_PAID_HOURS_PER_MONTH)
  paidHours!: number

  @ApiNumber()
  baseSalary!: number

  // ── Viðbótarlaun — fastar greiðslur aðrar en grunnlaun (Launagögn J–L) ──
  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime!: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance!: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedOther!: number | null

  // ── Aukagreiðslur — tilfallandi greiðslur (Launagögn M–O). Reported
  //    on their own; NOT part of regluleg laun or reglulegt tímakaup. ──
  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime!: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance!: number | null

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

  // Null while the report is a DRAFT (score not yet computed); populated on
  // submit.
  @ApiOptionalNumber({ nullable: true })
  score!: number | null
}
