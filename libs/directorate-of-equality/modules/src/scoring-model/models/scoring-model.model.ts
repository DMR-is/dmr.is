import { Column, DataType, ForeignKey, HasMany } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { DoeModels } from '../../constants'
import { ScoringCriterionModel } from './scoring-criterion.model'
import { ScoringRoleModel } from './scoring-role.model'

type ScoringModelAttributes = {
  companyId: string
  name: string
}

type ScoringModelCreateAttributes = ScoringModelAttributes

/**
 * A company's starfsmat — the criteria tree and role step assignments a salary
 * report is scored against.
 *
 * Authored once and referenced by id from a filing, rather than re-transmitted
 * with every submission. At submit the tree is expanded into the per-report
 * snapshot (`report_criterion` and friends), which is what keeps a filed report
 * interpretable after the company reworks its model — and is why this table
 * carries no version.
 */
@MutableTable({ tableName: DoeModels.SCORING_MODEL })
export class ScoringModelModel extends MutableModel<
  ScoringModelAttributes,
  ScoringModelCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @HasMany(() => ScoringCriterionModel, {
    foreignKey: 'scoringModelId',
    as: 'criteria',
  })
  criteria?: ScoringCriterionModel[]

  @HasMany(() => ScoringRoleModel, {
    foreignKey: 'scoringModelId',
    as: 'roles',
  })
  roles?: ScoringRoleModel[]
}
