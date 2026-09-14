import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ScoringModelModel } from './scoring-model.model'
import { ScoringRoleStepModel } from './scoring-role-step.model'

type ScoringRoleAttributes = {
  scoringModelId: string
  title: string
}

type ScoringRoleCreateAttributes = ScoringRoleAttributes

/**
 * A job (starf) in the company's scoring model.
 *
 * A role owns the job-based criteria: every role carries exactly one step
 * assignment per job-based sub-criterion, and an employee's job-based score is
 * their role's. Employees own only the personal criteria.
 */
@MutableTable({ tableName: DoeModels.SCORING_ROLE })
export class ScoringRoleModel extends MutableModel<
  ScoringRoleAttributes,
  ScoringRoleCreateAttributes
> {
  @ForeignKey(() => ScoringModelModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'scoring_model_id' })
  scoringModelId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  @BelongsTo(() => ScoringModelModel, {
    foreignKey: 'scoringModelId',
    as: 'scoringModel',
  })
  scoringModel?: ScoringModelModel

  @HasMany(() => ScoringRoleStepModel, {
    foreignKey: 'scoringRoleId',
    as: 'stepAssignments',
  })
  stepAssignments?: ScoringRoleStepModel[]
}
