import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import type { ScoringModelModel as ScoringModelModelRef } from './scoring-model.model'
import { ScoringModelModel } from './scoring-model.model'
import { ScoringSubCriterionModel } from './scoring-sub-criterion.model'

type ScoringCriterionAttributes = {
  scoringModelId: string
  type: ReportCriterionTypeEnum
  title: string
  description: string
}

type ScoringCriterionCreateAttributes = ScoringCriterionAttributes

/**
 * One criterion (viðmið) in a company's scoring model.
 *
 * Carries **no weight column**, deliberately. A criterion's weight is the sum of
 * its own sub-criteria's weights and nothing else — `computeStepScore` reads the
 * sub-criterion weight alone, so a stored criterion weight never reaches a score
 * and can only disagree with the figures that do. Deriving it makes the
 * displayed weight true by construction.
 *
 * `type` reuses {@link ReportCriterionTypeEnum}: the same five values with the
 * same meaning as on a filed report.
 */
@MutableTable({ tableName: DoeModels.SCORING_CRITERION })
export class ScoringCriterionModel extends MutableModel<
  ScoringCriterionAttributes,
  ScoringCriterionCreateAttributes
> {
  @ForeignKey(() => ScoringModelModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'scoring_model_id' })
  scoringModelId!: string

  @Column({
    type: DataType.ENUM(...Object.values(ReportCriterionTypeEnum)),
    allowNull: false,
  })
  type!: ReportCriterionTypeEnum

  @Column({ type: DataType.TEXT, allowNull: false })
  title!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string

  @BelongsTo(() => ScoringModelModel, {
    foreignKey: 'scoringModelId',
    as: 'scoringModel',
  })
  scoringModel?: ScoringModelModelRef

  @HasMany(() => ScoringSubCriterionModel, {
    foreignKey: 'scoringCriterionId',
    as: 'subCriteria',
  })
  subCriteria?: ScoringSubCriterionModel[]
}
