import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { GenderEnum, ReportModel } from '../../report/models/report.model'
import type { ReportEmployeeDto } from '../dto/report-employee.dto'
import { ReportEmployeeRoleModel } from './report-employee-role.model'

/** DECIMAL columns come back from the driver as strings; null stays null. */
const parseNullableDecimal = (value: unknown): number | null =>
  value !== null && value !== undefined
    ? parseFloat(value as string)
    : null

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

export enum EducationEnum {
  COMPULSORY = 'COMPULSORY',
  UPPER_SECONDARY = 'UPPER_SECONDARY',
  VOCATIONAL = 'VOCATIONAL',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  PROFESSIONAL = 'PROFESSIONAL',
}

type ReportEmployeeAttributes = {
  ordinal: number
  education: EducationEnum
  field: string
  department: string
  startDate: string
  workRatio: number
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
  score: number
}

type ReportEmployeeCreateAttributes = {
  ordinal: number
  education: EducationEnum
  field: string
  department: string
  startDate: string
  workRatio: number
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
  score: number
}

@MutableTable({ tableName: DoeModels.REPORT_EMPLOYEE })
export class ReportEmployeeModel extends MutableModel<
  ReportEmployeeAttributes,
  ReportEmployeeCreateAttributes
> {
  @Column({ type: DataType.INTEGER, allowNull: false })
  ordinal!: number

  @Column({
    type: DataType.ENUM(...Object.values(EducationEnum)),
    allowNull: false,
  })
  education!: EducationEnum

  @Column({ type: DataType.TEXT, allowNull: false })
  field!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  department!: string

  @Column({ type: DataType.DATEONLY, allowNull: false, field: 'start_date' })
  startDate!: string

  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    field: 'work_ratio',
    get() {
      const value = this.getDataValue('workRatio')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  workRatio!: number

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
    allowNull: false,
    get() {
      const value = this.getDataValue('score')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  score!: number

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
      education: model.education,
      field: model.field,
      department: model.department,
      startDate: model.startDate,
      workRatio: model.workRatio,
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
