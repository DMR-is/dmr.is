import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { GenderEnum, ReportModel } from '../../report/models/report.model'
import type { ReportEmployeeDto } from '../dto/report-employee.dto'
import { ReportEmployeeRoleModel } from './report-employee-role.model'

/** DECIMAL columns come back from the driver as strings; null stays null. */
const parseNullableDecimal = (value: unknown): number | null =>
  value !== null && value !== undefined ? parseFloat(value as string) : null

/**
 * Viðbótarlaun (additional salary) = sum of its fixed sub-components, each
 * `null` (not entered) treated as `0`. Pure so the composition rule is
 * testable without a model instance.
 */
export const computeAdditionalSalary = (children: {
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
}): number =>
  (children.additionalFixedOvertime ?? 0) +
  (children.additionalFixedCarAllowance ?? 0)

/**
 * Aukagreiðslur (bonus salary) = sum of its occasional / bonus sub-components,
 * each `null` (not entered) treated as `0`.
 */
export const computeBonusSalary = (children: {
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
  bonusPayments: number | null
  bonusOther: number | null
}): number =>
  (children.bonusOccasionalCarAllowance ?? 0) +
  (children.bonusOccasionalOvertime ?? 0) +
  (children.bonusPayments ?? 0) +
  (children.bonusOther ?? 0)

/**
 * The seven pay fields that compose **regluleg laun**, named once so the
 * composition is stated in exactly one place.
 */
type RegularWageComponents = {
  baseSalary: number
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
  bonusPayments: number | null
  bonusOther: number | null
}

/**
 * Regluleg laun = grunnlaun + viðbótarlaun + aukagreiðslur — every collected pay
 * field, each unentered child treated as `0`.
 *
 * ⚠️ **The wide reading is deliberate. Do not narrow it.** Hagstofa's published
 * definition of *regluleg laun* is *"greidd mánaðarlaun fyrir umsaminn
 * vinnutíma … hvers konar álags- og bónusgreiðslur"*, which read strictly
 * excludes tilfallandi yfirvinna and does not clearly cover aukagreiðslur. The
 * Directorate approved this wider formula regardless, "until further notice",
 * and it is what the Excel template's own `Regluleg laun` column computes. A
 * later reader who narrows this to match Hagstofa's wording would silently move
 * every company's tímakaup and every published gap figure — so the discrepancy
 * is recorded here rather than left to be discovered and "fixed".
 */
export const computeRegularWages = (employee: RegularWageComponents): number =>
  employee.baseSalary +
  computeAdditionalSalary(employee) +
  computeBonusSalary(employee)

/**
 * Decimal places every pay column on `report_employee` stores — they are all
 * `DECIMAL(_, 2)`, `paid_hours` included.
 */
export const STORED_PAY_DECIMALS = 2

/** Quantizes one value to what the database will actually keep. */
const toStoredPrecision = (value: number): number =>
  Math.round(value * 10 ** STORED_PAY_DECIMALS) / 10 ** STORED_PAY_DECIMALS

/**
 * Reglulegt tímakaup for an employee that has **not been persisted yet** —
 * computed at storage precision, so it equals what the same row will yield
 * after a database round-trip.
 *
 * ⚠️ **This is why previews and the frozen snapshot agree.** The parser emits
 * full-precision floats; `report_employee` stores every pay column and
 * `paid_hours` as `DECIMAL(_, 2)`. Decomposing raw parsed floats and then
 * re-decomposing the stored rows are therefore two slightly different
 * calculations, and the lágmarksmengi is chosen by a greedy walk over
 * contributions — so at the margin they can select DIFFERENT EMPLOYEES. The
 * applicant would then see one list before submitting and the reviewer a
 * different one after, with nothing to explain the change. Quantizing first
 * removes the divergence at its source rather than papering over it downstream.
 *
 * ⚠️ **Never divide by a starfshlutfall as well.** Paid hours already normalise
 * for working time, and more precisely than an FTE proxy does; applying both
 * would double-count part-time. That is why `work_ratio` was dropped rather
 * than kept alongside `paid_hours`.
 *
 * Callers holding PERSISTED rows want `getRegularHourlyWage` instead — those
 * values are already at storage precision, so quantizing again is a no-op that
 * only obscures where the rounding happens.
 *
 * Guard `paidHours > 0` first: parsed input is unvalidated at this point.
 */
export const parsedRegularHourlyWage = (
  employee: RegularWageComponents & { paidHours: number },
): number => {
  const stored: RegularWageComponents & { paidHours: number } = {
    paidHours: toStoredPrecision(employee.paidHours),
    baseSalary: toStoredPrecision(employee.baseSalary),
    additionalFixedOvertime: nullableToStored(employee.additionalFixedOvertime),
    additionalFixedCarAllowance: nullableToStored(
      employee.additionalFixedCarAllowance,
    ),
    bonusOccasionalCarAllowance: nullableToStored(
      employee.bonusOccasionalCarAllowance,
    ),
    bonusOccasionalOvertime: nullableToStored(employee.bonusOccasionalOvertime),
    bonusPayments: nullableToStored(employee.bonusPayments),
    bonusOther: nullableToStored(employee.bonusOther),
  }

  return computeRegularWages(stored) / stored.paidHours
}

const nullableToStored = (value: number | null): number | null =>
  value === null ? null : toStoredPrecision(value)

/**
 * Asserts an employee's score has been computed. A draft's employee scores are
 * NULL until the report is submitted; the submit-time snapshot and the
 * reviewer-facing chart/aggregate paths only ever run on submitted reports, so
 * a NULL here is an invariant violation (a bug), not an expected state.
 */
export function requireComputedScore(employee: {
  id: string
  score: number | null
}): number {
  if (employee.score === null || employee.score === undefined) {
    throw new Error(
      `Employee ${employee.id} has no computed score — scores must be computed before this path runs`,
    )
  }
  return employee.score
}

type ReportEmployeeAttributes = {
  ordinal: number
  field: string | null
  department: string | null
  startDate: string
  paidHours: number
  baseSalary: number
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
  bonusPayments: number | null
  bonusOther: number | null
  gender: GenderEnum
  reportEmployeeRoleId: string
  reportId: string
  // Derived from step assignments; NULL while the report is a DRAFT (not yet
  // computed), populated when the report is submitted. See db/README.md.
  score: number | null
}

type ReportEmployeeCreateAttributes = {
  ordinal: number
  field?: string | null
  department?: string | null
  startDate: string
  paidHours: number
  baseSalary: number
  additionalFixedOvertime?: number | null
  additionalFixedCarAllowance?: number | null
  bonusOccasionalCarAllowance?: number | null
  bonusOccasionalOvertime?: number | null
  bonusPayments?: number | null
  bonusOther?: number | null
  gender: GenderEnum
  reportEmployeeRoleId: string
  reportId: string
  score?: number | null
}

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE })
export class ReportEmployeeModel extends MutableModel<
  ReportEmployeeAttributes,
  ReportEmployeeCreateAttributes
> {
  @Column({ type: DataType.INTEGER, allowNull: false })
  ordinal!: number

  @Column({ type: DataType.TEXT, allowNull: true })
  field!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  department!: string | null

  @Column({ type: DataType.DATEONLY, allowNull: false, field: 'start_date' })
  startDate!: string

  /**
   * Greiddar stundir í mánuðinum, yfirvinnustundir meðtaldar — the denominator
   * of reglulegt tímakaup. `NOT NULL CHECK (paid_hours > 0)`, so never zero on
   * persisted data. Replaced `work_ratio`; see {@link computeRegularHourlyWage}
   * for why the two must not coexist.
   */
  @Column({
    type: DataType.DECIMAL(6, 2),
    allowNull: false,
    field: 'paid_hours',
    get() {
      const value = this.getDataValue('paidHours')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  paidHours!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'base_salary',
    get() {
      const value = this.getDataValue('baseSalary')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  baseSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'additional_fixed_overtime',
    get() {
      return parseNullableDecimal(this.getDataValue('additionalFixedOvertime'))
    },
  })
  additionalFixedOvertime!: number | null

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'additional_fixed_car_allowance',
    get() {
      return parseNullableDecimal(
        this.getDataValue('additionalFixedCarAllowance'),
      )
    },
  })
  additionalFixedCarAllowance!: number | null

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'bonus_occasional_car_allowance',
    get() {
      return parseNullableDecimal(
        this.getDataValue('bonusOccasionalCarAllowance'),
      )
    },
  })
  bonusOccasionalCarAllowance!: number | null

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'bonus_occasional_overtime',
    get() {
      return parseNullableDecimal(this.getDataValue('bonusOccasionalOvertime'))
    },
  })
  bonusOccasionalOvertime!: number | null

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'bonus_payments',
    get() {
      return parseNullableDecimal(this.getDataValue('bonusPayments'))
    },
  })
  bonusPayments!: number | null

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'bonus_other',
    get() {
      return parseNullableDecimal(this.getDataValue('bonusOther'))
    },
  })
  bonusOther!: number | null

  /**
   * Viðbótarlaun — derived, not stored. Sum of its fixed sub-components, each
   * treated as 0 when not entered.
   */
  get additionalSalary(): number {
    return computeAdditionalSalary(this)
  }

  /**
   * Aukagreiðslur — derived, not stored. Sum of its occasional / bonus
   * sub-components, each treated as 0 when not entered.
   */
  get bonusSalary(): number {
    return computeBonusSalary(this)
  }

  @Column({
    type: DataType.ENUM(...Object.values(GenderEnum)),
    allowNull: false,
  })
  gender!: GenderEnum

  @ForeignKey(() => ReportEmployeeRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_role_id',
  })
  reportEmployeeRoleId!: string

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @Column({
    type: DataType.DECIMAL(6, 2),
    allowNull: true,
    get() {
      const value = this.getDataValue('score')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  score!: number | null

  @BelongsTo(() => ReportEmployeeRoleModel, {
    foreignKey: 'reportEmployeeRoleId',
    as: 'role',
  })
  role?: ReportEmployeeRoleModel

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportEmployeeModel): ReportEmployeeDto {
    return {
      id: model.id,
      ordinal: model.ordinal,
      field: model.field,
      department: model.department,
      startDate: model.startDate,
      paidHours: model.paidHours,
      baseSalary: model.baseSalary,
      additionalFixedOvertime: model.additionalFixedOvertime,
      additionalFixedCarAllowance: model.additionalFixedCarAllowance,
      bonusOccasionalCarAllowance: model.bonusOccasionalCarAllowance,
      bonusOccasionalOvertime: model.bonusOccasionalOvertime,
      bonusPayments: model.bonusPayments,
      bonusOther: model.bonusOther,
      additionalSalary: model.additionalSalary,
      bonusSalary: model.bonusSalary,
      gender: model.gender,
      reportEmployeeRoleId: model.reportEmployeeRoleId,
      reportId: model.reportId,
      score: model.score,
    }
  }

  fromModel(): ReportEmployeeDto {
    return ReportEmployeeModel.fromModel(this)
  }
}
