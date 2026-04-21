import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import type { ReportRoleResultDto } from '../dto/report-role-result.dto'
import { ReportResultModel } from './report-result.model'

const parseDecimal = (raw: unknown): number | null =>
  raw === null || raw === undefined ? null : parseFloat(raw as string)

type ReportRoleResultAttributes = {
  reportResultId: string
  reportEmployeeRoleId: string
  averageSalary: number
  minimumSalary: number
  maximumSalary: number
  medianSalary: number
  averageMaleSalary: number
  averageFemaleSalary: number
  averageNeutralSalary: number
  minimumMaleSalary: number
  minimumFemaleSalary: number
  minimumNeutralSalary: number
  maximumMaleSalary: number
  maximumFemaleSalary: number
  maximumNeutralSalary: number
}

type ReportRoleResultCreateAttributes = ReportRoleResultAttributes

@MutableTable({ tableName: DoeModels.REPORT_ROLE_RESULT })
export class ReportRoleResultModel extends MutableModel<
  ReportRoleResultAttributes,
  ReportRoleResultCreateAttributes
> {
  @ForeignKey(() => ReportResultModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_result_id',
  })
  reportResultId!: string

  @ForeignKey(() => ReportEmployeeRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_role_id',
  })
  reportEmployeeRoleId!: string

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'average_salary',
    get() {
      return parseDecimal(this.getDataValue('averageSalary'))
    },
  })
  averageSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'minimum_salary',
    get() {
      return parseDecimal(this.getDataValue('minimumSalary'))
    },
  })
  minimumSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'maximum_salary',
    get() {
      return parseDecimal(this.getDataValue('maximumSalary'))
    },
  })
  maximumSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'median_salary',
    get() {
      return parseDecimal(this.getDataValue('medianSalary'))
    },
  })
  medianSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'average_male_salary',
    get() {
      return parseDecimal(this.getDataValue('averageMaleSalary'))
    },
  })
  averageMaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'average_female_salary',
    get() {
      return parseDecimal(this.getDataValue('averageFemaleSalary'))
    },
  })
  averageFemaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'average_neutral_salary',
    get() {
      return parseDecimal(this.getDataValue('averageNeutralSalary'))
    },
  })
  averageNeutralSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'minimum_male_salary',
    get() {
      return parseDecimal(this.getDataValue('minimumMaleSalary'))
    },
  })
  minimumMaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'minimum_female_salary',
    get() {
      return parseDecimal(this.getDataValue('minimumFemaleSalary'))
    },
  })
  minimumFemaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'minimum_neutral_salary',
    get() {
      return parseDecimal(this.getDataValue('minimumNeutralSalary'))
    },
  })
  minimumNeutralSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'maximum_male_salary',
    get() {
      return parseDecimal(this.getDataValue('maximumMaleSalary'))
    },
  })
  maximumMaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'maximum_female_salary',
    get() {
      return parseDecimal(this.getDataValue('maximumFemaleSalary'))
    },
  })
  maximumFemaleSalary!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'maximum_neutral_salary',
    get() {
      return parseDecimal(this.getDataValue('maximumNeutralSalary'))
    },
  })
  maximumNeutralSalary!: number

  @BelongsTo(() => ReportResultModel, {
    foreignKey: 'reportResultId',
    as: 'reportResult',
  })
  reportResult?: ReportResultModel

  @BelongsTo(() => ReportEmployeeRoleModel, {
    foreignKey: 'reportEmployeeRoleId',
    as: 'role',
  })
  role?: ReportEmployeeRoleModel

  static fromModel(model: ReportRoleResultModel): ReportRoleResultDto {
    return {
      id: model.id,
      reportResultId: model.reportResultId,
      reportEmployeeRoleId: model.reportEmployeeRoleId,
      averageSalary: model.averageSalary,
      minimumSalary: model.minimumSalary,
      maximumSalary: model.maximumSalary,
      medianSalary: model.medianSalary,
      averageMaleSalary: model.averageMaleSalary,
      averageFemaleSalary: model.averageFemaleSalary,
      averageNeutralSalary: model.averageNeutralSalary,
      minimumMaleSalary: model.minimumMaleSalary,
      minimumFemaleSalary: model.minimumFemaleSalary,
      minimumNeutralSalary: model.minimumNeutralSalary,
      maximumMaleSalary: model.maximumMaleSalary,
      maximumFemaleSalary: model.maximumFemaleSalary,
      maximumNeutralSalary: model.maximumNeutralSalary,
    }
  }

  fromModel(): ReportRoleResultDto {
    return ReportRoleResultModel.fromModel(this)
  }
}
