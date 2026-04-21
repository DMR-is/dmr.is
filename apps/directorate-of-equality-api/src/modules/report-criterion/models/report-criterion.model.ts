import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { ReportCriterionDto } from '../dto/report-criterion.dto'

export enum ReportCriterionTypeEnum {
  RESPONSIBILITY = 'RESPONSIBILITY',
  STRAIN = 'STRAIN',
  CONDITION = 'CONDITION',
  COMPETENCE = 'COMPETENCE',
  PERSONAL = 'PERSONAL',
}

type ReportCriterionAttributes = {
  title: string
  weight: number
  description: string
  type: ReportCriterionTypeEnum
  reportId: string
}

type ReportCriterionCreateAttributes = {
  title: string
  weight: number
  description: string
  type: ReportCriterionTypeEnum
  reportId: string
}

@MutableTable({ tableName: DoeModels.REPORT_CRITERION })
export class ReportCriterionModel extends MutableModel<
  ReportCriterionAttributes,
  ReportCriterionCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  @Column({
    type: DataType.DECIMAL(6, 4),
    allowNull: false,
    get() {
      const value = this.getDataValue('weight')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  weight!: number

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @Column({
    type: DataType.ENUM(...Object.values(ReportCriterionTypeEnum)),
    allowNull: false,
  })
  type!: ReportCriterionTypeEnum

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  static fromModel(model: ReportCriterionModel): ReportCriterionDto {
    return {
      id: model.id,
      title: model.title,
      weight: model.weight,
      description: model.description,
      type: model.type,
      reportId: model.reportId,
    }
  }

  fromModel(): ReportCriterionDto {
    return ReportCriterionModel.fromModel(this)
  }
}
