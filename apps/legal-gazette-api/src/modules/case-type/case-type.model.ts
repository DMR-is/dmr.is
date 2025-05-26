import { HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { CaseCategoryModel } from '../case-category/case-category.model'

@BaseEntityTable({ tableName: LegalGazetteModels.CASE_TYPE })
export class CaseTypeModel extends BaseEntityModel {
  @HasMany(() => CaseCategoryModel)
  categories!: CaseCategoryModel[]
}
