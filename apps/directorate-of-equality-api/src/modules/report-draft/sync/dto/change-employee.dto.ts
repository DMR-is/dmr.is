import { IsUUID } from 'class-validator'

import {
  ApiEnum,
  ApiOptionalArray,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUUID,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../../report/models/report.enums'
import { EducationEnum } from '../../../report-employee/models/report-employee.model'
import { SyncMethodEnum } from '../sync-method.enum'

/**
 * Editable fields of an employee in a sync batch. All optional (flat command
 * DTO); the CREATE-required fields (role, education, gender, field, department,
 * startDate, workRatio, baseSalary) are validated server-side. `ordinal` and
 * `score` are never client-set — ordinal is server-assigned, score derived at
 * submit.
 *
 * `stepIds`, when present, REPLACES the employee's personal step-assignment set.
 * `outlierGroupId` sets/clears outlier-group membership (null clears) and is
 * applied after outlier detection — the employee must be a detected outlier.
 */
export class EmployeeChangeDataDto {
  @ApiOptionalUUID({ description: 'Id of a role on the same draft.' })
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
      'Outlier-group membership (null clears). Applied after detection; the employee must be a currently-detected outlier.',
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
