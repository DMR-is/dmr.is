import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ScoringSubCriterionModel } from './scoring-sub-criterion.model'

type ScoringSubCriterionStepAttributes = {
  scoringSubCriterionId: string
  stepOrder: number
  description: string
}

type ScoringSubCriterionStepCreateAttributes =
  ScoringSubCriterionStepAttributes

/**
 * One step (þrep) on a sub-criterion's scale.
 *
 * Carries **no score column**, deliberately: a step's score is
 * `(stepOrder / numSteps) * subWeight * SCORE_FACTOR`, derived at expansion.
 * Storing it — or asking a caller to send it — is what lets a vendor file stig
 * on a scale of their own, which nothing downstream validates.
 */
@MutableTable({ tableName: DoeModels.SCORING_SUB_CRITERION_STEP })
export class ScoringSubCriterionStepModel extends MutableModel<
  ScoringSubCriterionStepAttributes,
  ScoringSubCriterionStepCreateAttributes
> {
  @ForeignKey(() => ScoringSubCriterionModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'scoring_sub_criterion_id',
  })
  scoringSubCriterionId!: string

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'step_order' })
  stepOrder!: number

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @BelongsTo(() => ScoringSubCriterionModel, {
    foreignKey: 'scoringSubCriterionId',
    as: 'scoringSubCriterion',
  })
  scoringSubCriterion?: ScoringSubCriterionModel
}
