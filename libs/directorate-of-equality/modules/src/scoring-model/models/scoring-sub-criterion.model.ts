import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ScoringCriterionModel } from './scoring-criterion.model'
import { ScoringSubCriterionStepModel } from './scoring-sub-criterion-step.model'

type ScoringSubCriterionAttributes = {
  scoringCriterionId: string
  title: string
  description: string
  weight: number
}

type ScoringSubCriterionCreateAttributes = ScoringSubCriterionAttributes

/**
 * One sub-criterion (undirviðmið) — and the only place a weight is stored.
 *
 * Every sub-criterion weight across a whole model sums to 100. That single
 * distribution is what scores: a criterion's weight is the sum of its own
 * sub-criteria's, so the two weight rules the submission validator checks
 * separately collapse into this one.
 */
@MutableTable({ tableName: DoeModels.SCORING_SUB_CRITERION })
export class ScoringSubCriterionModel extends MutableModel<
  ScoringSubCriterionAttributes,
  ScoringSubCriterionCreateAttributes
> {
  @ForeignKey(() => ScoringCriterionModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'scoring_criterion_id',
  })
  scoringCriterionId!: string

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

  @BelongsTo(() => ScoringCriterionModel, {
    foreignKey: 'scoringCriterionId',
    as: 'scoringCriterion',
  })
  scoringCriterion?: ScoringCriterionModel

  @HasMany(() => ScoringSubCriterionStepModel, {
    foreignKey: 'scoringSubCriterionId',
    as: 'steps',
  })
  steps?: ScoringSubCriterionStepModel[]
}
