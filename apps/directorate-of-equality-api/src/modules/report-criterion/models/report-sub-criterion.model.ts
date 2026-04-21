import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ReportSubCriterionDto } from '../dto/report-sub-criterion.dto'
import { ReportCriterionModel } from './report-criterion.model'

type ReportSubCriterionAttributes = {
  title: string
  description: string
  weight: number
  reportCriterionId: string
}

type ReportSubCriterionCreateAttributes = ReportSubCriterionAttributes

@MutableTable({ tableName: DoeModels.REPORT_SUB_CRITERION })
export class ReportSubCriterionModel extends MutableModel<
  ReportSubCriterionAttributes,
  ReportSubCriterionCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

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

  @ForeignKey(() => ReportCriterionModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_criterion_id',
  })
  reportCriterionId!: string

  @BelongsTo(() => ReportCriterionModel, {
    foreignKey: 'reportCriterionId',
    as: 'reportCriterion',
  })
  reportCriterion?: ReportCriterionModel

  static fromModel(model: ReportSubCriterionModel): ReportSubCriterionDto {
    return {
      id: model.id,
      title: model.title,
      description: model.description,
      weight: model.weight,
      reportCriterionId: model.reportCriterionId,
    }
  }

  fromModel(): ReportSubCriterionDto {
    return ReportSubCriterionModel.fromModel(this)
  }
}
