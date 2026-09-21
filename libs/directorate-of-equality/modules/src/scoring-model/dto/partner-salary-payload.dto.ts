import {
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'

export class PartnerPersonalStepDto {
  @ApiUUId({
    description:
      'A personal sub-criterion in the scoring model this filing names. Job-based ones belong to the employee’s job and are refused here.',
  })
  subCriterionId!: string

  @ApiUUId({
    description:
      'Which þrep on that sub-criterion’s scale this employee sits at. Must belong to the sub-criterion named beside it.',
  })
  stepId!: string
}

/**
 * One employee, as a payroll system holds them.
 *
 * Everything here except `personalSteps` is payroll data — fourteen fields of it. That one field is the
 * employer's assessment — around a tenth of the total weight — and no system
 * derives it; it is the reason a vendor still needs somewhere to collect input.
 *
 * The job is named by **id**, not by title. On the old contract an employee
 * carried a `roleTitle` that had to match a `roles[].title` string elsewhere in
 * the same payload; here the job already exists in the scoring model and a
 * mismatch is a 400 rather than a silently unmatched row.
 */
export class PartnerEmployeeDto {
  @ApiNumber({
    description:
      'This employee’s identity for the whole submission: the analysis returns ordinals and the outlier groups reference them. Assign once and keep stable.',
  })
  ordinal!: number

  @ApiString({
    description:
      'Pseudonymous handle — the employer’s own, never a kennitala. Shown to reviewers so a flagged row can be traced back internally.',
  })
  identifier!: string

  @ApiUUId({
    description: 'The job this employee holds, from the scoring model.',
  })
  roleId!: string

  @ApiEnum(GenderEnum, { enumName: 'GenderEnum' })
  gender!: GenderEnum

  @ApiOptionalString({ nullable: true })
  field?: string | null

  @ApiOptionalString({ nullable: true })
  department?: string | null

  @ApiString({ description: 'ISO date the employee started, `YYYY-MM-DD`.' })
  startDate!: string

  @ApiNumber({
    description:
      'Greiddar stundir í mánuðinum — the denominator of reglulegt tímakaup. Fixed overtime counts; incidental hours do not.',
  })
  paidHours!: number

  @ApiNumber({ description: 'Grunnlaun.' })
  baseSalary!: number

  @ApiOptionalNumber({ nullable: true })
  additionalFixedOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  additionalFixedOther?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalOvertime?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOccasionalCarAllowance?: number | null

  @ApiOptionalNumber({ nullable: true })
  bonusOther?: number | null

  @ApiDtoArray(PartnerPersonalStepDto, {
    description:
      'Where this employee sits on each **personal** sub-criterion — the employer’s judgement, not payroll data. One entry per personal sub-criterion in the model; a model with none takes an empty array.',
  })
  personalSteps!: PartnerPersonalStepDto[]
}
