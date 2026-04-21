import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { GenderEnum, ReportModel } from '../../report/models/report.model'
import type { ReportEmployeeDto } from '../dto/report-employee.dto'
import { ReportEmployeeRoleModel } from './report-employee-role.model'

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
  additionalSalary: number
  bonusSalary: number | null
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
  additionalSalary: number
  bonusSalary?: number | null
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
    allowNull: false,
    field: 'additional_salary',
    get() {
      const value = this.getDataValue('additionalSalary')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  additionalSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: true,
    field: 'bonus_salary',
    get() {
      const value = this.getDataValue('bonusSalary')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  bonusSalary!: number | null

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
