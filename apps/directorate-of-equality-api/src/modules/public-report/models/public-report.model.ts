import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { PublicReportDto } from '../dto/public-report.dto'

const parseDecimal = (raw: unknown): number | null =>
  raw === null || raw === undefined ? null : parseFloat(raw as string)

type PublicReportAttributes = {
  sourceReportId: string
  sizeBucket: string
  isatCategory: string
  publishedAt: Date
  validUntil: Date
  averageMaleSalary: number
  averageFemaleSalary: number
  averageNeutralSalary: number
  salaryDifferenceMaleFemale: number
  salaryDifferenceMaleNeutral: number
  salaryDifferenceFemaleMale: number
  salaryDifferenceFemaleNeutral: number
  salaryDifferenceNeutralMale: number
  salaryDifferenceNeutralFemale: number
}

type PublicReportCreateAttributes = {
  sourceReportId: string
  sizeBucket: string
  isatCategory: string
  publishedAt?: Date
  validUntil: Date
  averageMaleSalary: number
  averageFemaleSalary: number
  averageNeutralSalary: number
  salaryDifferenceMaleFemale: number
  salaryDifferenceMaleNeutral: number
  salaryDifferenceFemaleMale: number
  salaryDifferenceFemaleNeutral: number
  salaryDifferenceNeutralMale: number
  salaryDifferenceNeutralFemale: number
}

@ImmutableTable({ tableName: DoeModels.PUBLIC_REPORT })
export class PublicReportModel extends ImmutableModel<
  PublicReportAttributes,
  PublicReportCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'source_report_id',
  })
  sourceReportId!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'size_bucket' })
  sizeBucket!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'isat_category' })
  isatCategory!: string

  @Column({ type: DataType.DATE, allowNull: false, field: 'published_at' })
  publishedAt!: Date

  @Column({ type: DataType.DATE, allowNull: false, field: 'valid_until' })
  validUntil!: Date

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

  @BelongsTo(() => ReportModel, {
    foreignKey: 'sourceReportId',
    as: 'sourceReport',
  })
  sourceReport?: ReportModel

  static fromModel(model: PublicReportModel): PublicReportDto {
    return {
      id: model.id,
      sizeBucket: model.sizeBucket,
      isatCategory: model.isatCategory,
      publishedAt: model.publishedAt,
      validUntil: model.validUntil,
      averageMaleSalary: model.averageMaleSalary,
      averageFemaleSalary: model.averageFemaleSalary,
      averageNeutralSalary: model.averageNeutralSalary,
      salaryDifferenceMaleFemale: model.salaryDifferenceMaleFemale,
      salaryDifferenceMaleNeutral: model.salaryDifferenceMaleNeutral,
      salaryDifferenceFemaleMale: model.salaryDifferenceFemaleMale,
      salaryDifferenceFemaleNeutral: model.salaryDifferenceFemaleNeutral,
      salaryDifferenceNeutralMale: model.salaryDifferenceNeutralMale,
      salaryDifferenceNeutralFemale: model.salaryDifferenceNeutralFemale,
    }
  }

  fromModel(): PublicReportDto {
    return PublicReportModel.fromModel(this)
  }
}
