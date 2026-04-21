import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { ReportResultDto } from '../dto/report-result.dto'

const parseDecimal = (raw: unknown): number | null =>
  raw === null || raw === undefined ? null : parseFloat(raw as string)

type ReportResultAttributes = {
  reportId: string
  averageMaleSalary: number
  averageFemaleSalary: number
  averageNeutralSalary: number
  averageSalary: number
  minimumSalary: number
  maximumSalary: number
  medianSalary: number
  salaryDifferenceMaleFemale: number
  salaryDifferenceMaleNeutral: number
  salaryDifferenceFemaleMale: number
  salaryDifferenceFemaleNeutral: number
  salaryDifferenceNeutralMale: number
  salaryDifferenceNeutralFemale: number
}

type ReportResultCreateAttributes = ReportResultAttributes

@MutableTable({ tableName: DoeModels.REPORT_RESULT })
export class ReportResultModel extends MutableModel<
  ReportResultAttributes,
  ReportResultCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
    field: 'report_id',
  })
  reportId!: string

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
    field: 'salary_difference_male_female',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceMaleFemale'))
    },
  })
  salaryDifferenceMaleFemale!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'salary_difference_male_neutral',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceMaleNeutral'))
    },
  })
  salaryDifferenceMaleNeutral!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'salary_difference_female_male',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceFemaleMale'))
    },
  })
  salaryDifferenceFemaleMale!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'salary_difference_female_neutral',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceFemaleNeutral'))
    },
  })
  salaryDifferenceFemaleNeutral!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'salary_difference_neutral_male',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceNeutralMale'))
    },
  })
  salaryDifferenceNeutralMale!: number

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    field: 'salary_difference_neutral_female',
    get() {
      return parseDecimal(this.getDataValue('salaryDifferenceNeutralFemale'))
    },
  })
  salaryDifferenceNeutralFemale!: number

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportResultModel): ReportResultDto {
    return {
      id: model.id,
      reportId: model.reportId,
      averageMaleSalary: model.averageMaleSalary,
      averageFemaleSalary: model.averageFemaleSalary,
      averageNeutralSalary: model.averageNeutralSalary,
      averageSalary: model.averageSalary,
      minimumSalary: model.minimumSalary,
      maximumSalary: model.maximumSalary,
      medianSalary: model.medianSalary,
      salaryDifferenceMaleFemale: model.salaryDifferenceMaleFemale,
      salaryDifferenceMaleNeutral: model.salaryDifferenceMaleNeutral,
      salaryDifferenceFemaleMale: model.salaryDifferenceFemaleMale,
      salaryDifferenceFemaleNeutral: model.salaryDifferenceFemaleNeutral,
      salaryDifferenceNeutralMale: model.salaryDifferenceNeutralMale,
      salaryDifferenceNeutralFemale: model.salaryDifferenceNeutralFemale,
    }
  }

  fromModel(): ReportResultDto {
    return ReportResultModel.fromModel(this)
  }
}
