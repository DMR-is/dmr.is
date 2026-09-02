// Association annotations use a type-only alias — see `src/models.ts`.
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { ReportSubCriterionStepDto } from '../dto/report-sub-criterion-step.dto'
import type { ReportSubCriterionModel as ReportSubCriterionModelRef } from './report-sub-criterion.model'
import { ReportSubCriterionModel } from './report-sub-criterion.model'

type ReportSubCriterionStepAttributes = {
  order: number
  description: string
  reportSubCriterionId: string
  score: number
}

type ReportSubCriterionStepCreateAttributes = ReportSubCriterionStepAttributes

@MutableTable({ tableName: DoeModels.REPORT_SUB_CRITERION_STEP })
export class ReportSubCriterionStepModel extends MutableModel<
  ReportSubCriterionStepAttributes,
  ReportSubCriterionStepCreateAttributes
> {
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'order' })
  order!: number

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @ForeignKey(() => ReportSubCriterionModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_sub_criterion_id',
  })
  reportSubCriterionId!: string

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

  @BelongsTo(() => ReportSubCriterionModel, {
    foreignKey: 'reportSubCriterionId',
    as: 'reportSubCriterion',
  })
  reportSubCriterion?: ReportSubCriterionModelRef

  static fromModel(
    model: ReportSubCriterionStepModel,
  ): ReportSubCriterionStepDto {
    return {
      id: model.id,
      order: model.order,
      description: model.description,
      reportSubCriterionId: model.reportSubCriterionId,
      score: model.score,
    }
  }

  fromModel(): ReportSubCriterionStepDto {
    return ReportSubCriterionStepModel.fromModel(this)
  }
}
