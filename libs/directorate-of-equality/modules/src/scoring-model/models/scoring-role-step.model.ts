import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ScoringRoleModel } from './scoring-role.model'
import { ScoringSubCriterionModel } from './scoring-sub-criterion.model'
import { ScoringSubCriterionStepModel } from './scoring-sub-criterion-step.model'

type ScoringRoleStepAttributes = {
  scoringRoleId: string
  scoringSubCriterionId: string
  scoringSubCriterionStepId: string
}

type ScoringRoleStepCreateAttributes = ScoringRoleStepAttributes

/**
 * Which step a role sits on for one sub-criterion.
 *
 * Row existence is the assignment, so there is nothing to mutate and no
 * `updated_at` — re-assigning deletes and re-inserts, the same shape the report
 * side uses for `report_employee_role_criterion_step`.
 *
 * `scoringSubCriterionId` is denormalised from the step's own parent so that
 * "at most one assignment per role per sub-criterion" can be a table
 * constraint; the service asserts the step really belongs to that sub-criterion.
 */
@ImmutableTable({ tableName: DoeModels.SCORING_ROLE_STEP })
export class ScoringRoleStepModel extends ImmutableModel<
  ScoringRoleStepAttributes,
  ScoringRoleStepCreateAttributes
> {
  @ForeignKey(() => ScoringRoleModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'scoring_role_id' })
  scoringRoleId!: string

  @ForeignKey(() => ScoringSubCriterionModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'scoring_sub_criterion_id',
  })
  scoringSubCriterionId!: string

  @ForeignKey(() => ScoringSubCriterionStepModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'scoring_sub_criterion_step_id',
  })
  scoringSubCriterionStepId!: string

  @BelongsTo(() => ScoringRoleModel, {
    foreignKey: 'scoringRoleId',
    as: 'scoringRole',
  })
  scoringRole?: ScoringRoleModel

  @BelongsTo(() => ScoringSubCriterionStepModel, {
    foreignKey: 'scoringSubCriterionStepId',
    as: 'step',
  })
  step?: ScoringSubCriterionStepModel
}
