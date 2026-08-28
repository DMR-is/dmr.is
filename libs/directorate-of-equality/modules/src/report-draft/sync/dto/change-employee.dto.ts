import { IsUUID, Max, Min } from 'class-validator'

import {
  ApiEnum,
  ApiOptionalArray,
  ApiOptionalDto,
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
import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of an employee in a sync batch. All optional (flat command
 * DTO); the CREATE-required fields (role, gender, startDate,
 * paidHours, baseSalary) are validated server-side — `field` and `department`
 * are optional and may be left unset. `ordinal` and `score` are never
 * client-set — ordinal is server-assigned, score derived at submit.
 *
 * `stepIds`, when present, REPLACES the employee's personal step-assignment set.
 * `outlierGroupId` sets/clears outlier-group membership (null clears); it is
 * recorded as sent and reconciled against the detected-outlier set at submit.
 */
export class EmployeeChangeDataDto {
  @ApiOptionalUUID({ description: 'Id of a role on the same draft.' })
  reportEmployeeRoleId?: string

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender?: GenderEnum

  @ApiOptionalString({ nullable: true })
  field?: string | null

  @ApiOptionalString({ nullable: true })
  department?: string | null

  @ApiOptionalString({ description: 'Employment start date (YYYY-MM-DD).' })
  startDate?: string

  @ApiOptionalNumber({
    description:
      'Greiddar stundir í mánuðinum, yfirvinnustundir meðtaldar. Nefnari reglulegs tímakaups.',
    minimum: MIN_PAID_HOURS_PER_MONTH,
    maximum: MAX_PAID_HOURS_PER_MONTH,
  })
  @Min(MIN_PAID_HOURS_PER_MONTH)
  @Max(MAX_PAID_HOURS_PER_MONTH)
  paidHours?: number

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

  @ApiOptionalArray({
    type: [String],
    description:
      'Full set of personal step ids assigned to this employee (replace-all). Every id must be a step on the same draft.',
  })
  @IsUUID(undefined, { each: true })
  stepIds?: string[]

  @ApiOptionalUUID({
    nullable: true,
    description:
      'Outlier-group membership (null clears). Recorded as sent; a membership for an employee who is no longer a detected outlier is dropped at submit.',
  })
  outlierGroupId?: string | null
}

/**
 * One employee mutation in a sync batch. `id` is the client-minted UUID; CREATE
 * with an existing owned id is an idempotent upsert.
 */
export class ChangeEmployeeDto {
  @ApiEnum(SyncMethodEnum, { enumName: 'SyncMethodEnum' })
  method!: SyncMethodEnum

  @ApiOptionalUUID({ description: 'Client-minted UUID of the employee.' })
  id?: string

  @ApiOptionalDto(EmployeeChangeDataDto)
  data?: EmployeeChangeDataDto
}
