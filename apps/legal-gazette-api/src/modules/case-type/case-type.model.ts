import { HasMany, Table } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

import { CaseCategoryModel } from '../case-category/case-category.model'

@Table({ tableName: LegalGazetteModels.CASE_TYPE })
export class CaseTypeModel extends BaseEntityModel {
  @HasMany(() => CaseCategoryModel)
  categories!: CaseCategoryModel[]
}
