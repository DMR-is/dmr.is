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
 * Viðbótarlaun (additional salary) = **fastar greiðslur aðrar en grunnlaun** —
 * the sum of its fixed sub-components, each `null` (not entered) treated as
 * `0`. Pure so the composition rule is testable without a model instance.
 */
export const computeAdditionalSalary = (children: {
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  additionalFixedOther: number | null
}): number =>
  (children.additionalFixedOvertime ?? 0) +
  (children.additionalFixedCarAllowance ?? 0) +
  (children.additionalFixedOther ?? 0)

/**
 * Aukagreiðslur (bonus salary) = **tilfallandi greiðslur** — the sum of its
 * incidental sub-components, each `null` (not entered) treated as `0`.
 *
 * Still collected, still returned by the API, still shown to reviewers. It is
 * simply **not part of {@link computeRegularWages}** — see the note there.
 */
export const computeBonusSalary = (children: {
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
  bonusOther: number | null
}): number =>
  (children.bonusOccasionalCarAllowance ?? 0) +
  (children.bonusOccasionalOvertime ?? 0) +
  (children.bonusOther ?? 0)

/**
 * The pay fields that compose **regluleg laun**, named once so the composition
 * is stated in exactly one place. Incidental pay is deliberately absent — see
 * {@link computeRegularWages}.
 */
type RegularWageComponents = {
  baseSalary: number
  additionalFixedOvertime: number | null
  additionalFixedCarAllowance: number | null
  additionalFixedOther: number | null
}

/**
 * Regluleg laun = **grunnlaun + viðbótarlaun**, each unentered child treated as
 * `0`. Tilfallandi greiðslur teljast ekki með.
 *
 * ⚠️ **The narrow reading is deliberate. Do not widen it back.** This formula
 * used to include aukagreiðslur, on a wider reading the Directorate had
 * approved "until further notice". That notice arrived with Excel template 2.0
 * (2026-09-08), which re-cut the pay columns along fixed vs. incidental and
 * narrowed `Regluleg laun` to `I + P` on the sheet itself. The change is
 * coherent only as a pair with `paid_hours`: template 2.0 also narrowed
 * *Greiddar stundir* to exclude incidental hours, so numerator and denominator
 * now cover the same scope. Adding incidental pay back on top of fixed-only
 * hours would reintroduce exactly the mismatch this release removed.
 *
 * Figures produced here are **not comparable** with those from before the
 * change — anyone with incidental pay shows a lower tímakaup than the same
 * input produced under 1.x. That is intended, and is why `report_result` rows
 * written after this stamp `calculation_version = 'v4'`.
 *
 * See `.plans/doe/plan-launalidir-2-0.md`.
 */
export const computeRegularWages = (employee: RegularWageComponents): number =>
  employee.baseSalary + computeAdditionalSalary(employee)

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
    additionalFixedOther: nullableToStored(employee.additionalFixedOther),
  }

  return computeRegularWages(stored) / stored.paidHours
}

/**
 * `== null` catches `undefined` as well as `null`, deliberately. **This is a
 * live path, not a defensive flourish**, and the reachable route is worth
 * naming because the types actively hide it:
 *
 *   `POST /api/v1/application/reports/salary-analysis` (and its admin twin)
 *   → `SalaryAnalysisRequestDto.parsed` → `analyzeSalaryPayload`
 *   → `parsedRegularHourlyWage`
 *
 * That `ParsedReportDto` is a **request body**, not a parser output. Every pay
 * field on `ParsedEmployeeDto` is declared `!: number | null`, but each is
 * decorated `@ApiOptionalNumber`, which applies `IsOptional()` — so a client
 * that simply omits the key passes validation and the property arrives
 * `undefined`. The `!` is a TypeScript claim nothing enforces at the HTTP
 * boundary. (The Excel route is safe: `buildEmployee` always assigns from
 * `readNumber`, which returns `number | null`.)
 *
 * Omission is the EXPECTED shape right now, not a hypothetical: template 2.0
 * added `additionalFixedOther`, so every client that has not yet updated omits
 * exactly this field.
 *
 * Under `=== null` that becomes `toStoredPrecision(undefined)` → `NaN`, which
 * `?? 0` does NOT rescue, so one absent sub-component NaNs the employee's whole
 * tímakaup and, through `Math.log` in the pooled fit, every figure in the
 * report. Matches `parseNullableDecimal` above, which already guards both.
 */
const nullableToStored = (value: number | null | undefined): number | null =>
  value == null ? null : toStoredPrecision(value)

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
  additionalFixedOther: number | null
  bonusOccasionalCarAllowance: number | null
  bonusOccasionalOvertime: number | null
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
  additionalFixedOther?: number | null
  bonusOccasionalCarAllowance?: number | null
  bonusOccasionalOvertime?: number | null
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
   * Greiddar stundir í mánuðinum — **fastar yfirvinnustundir meðtaldar, en ekki
   * tilfallandi greiddar stundir** — the denominator of reglulegt tímakaup.
   * `NOT NULL CHECK (paid_hours > 0)`, so never zero on persisted data.
   *
   * ⚠️ The scope narrowed with template 2.0: it previously meant all paid
   * hours with all overtime included. It is the deliberate counterpart to
   * {@link computeRegularWages} dropping incidental pay — both sides of the
   * division now cover fixed pay and fixed hours only. Widening either one
   * alone reintroduces the mismatch.
   *
   * Replaced `work_ratio`; see {@link parsedRegularHourlyWage} for why the two
   * must not coexist.
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

  /**
   * Aðrar reglulegar greiðslur / hlunnindi — Launagögn column L. Added by
   * template 2.0, which reassigned L from an incidental car allowance to a
   * fixed payment. Feeds viðbótarlaun, and therefore regluleg laun.
   */
  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'additional_fixed_other',
    get() {
      return parseNullableDecimal(this.getDataValue('additionalFixedOther'))
    },
  })
  additionalFixedOther!: number | null

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
    field: 'bonus_other',
    get() {
      return parseNullableDecimal(this.getDataValue('bonusOther'))
    },
  })
  bonusOther!: number | null

  /**
   * Viðbótarlaun — derived, not stored. Sum of the three FIXED sub-components,
   * each treated as 0 when not entered. Part of regluleg laun.
   */
  get additionalSalary(): number {
    return computeAdditionalSalary(this)
  }

  /**
   * Aukagreiðslur — derived, not stored. Sum of the three INCIDENTAL
   * sub-components, each treated as 0 when not entered.
   *
   * Reported on its own, but **not** part of regluleg laun or reglulegt
   * tímakaup — see {@link computeRegularWages}.
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
      additionalFixedOther: model.additionalFixedOther,
      bonusOccasionalCarAllowance: model.bonusOccasionalCarAllowance,
      bonusOccasionalOvertime: model.bonusOccasionalOvertime,
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
