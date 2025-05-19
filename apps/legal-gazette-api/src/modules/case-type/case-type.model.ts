import { DefaultScope, HasMany, Scopes, Table } from 'sequelize-typescript'

import {
  BASE_ENTITY_ATTRIBUTES,
  BASE_ENTITY_ATTRIBUTES_DETAILED,
  BASE_ENTITY_ORDER_ASC,
  LegalGazetteModels,
} from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

import { CaseCategoryModel } from '../case-category/case-category.model'

@Table({
  tableName: LegalGazetteModels.CASE_TYPE,
})
@DefaultScope(() => ({
  attributes: BASE_ENTITY_ATTRIBUTES,
  order: BASE_ENTITY_ORDER_ASC,
}))
@Scopes(() => ({
  full: {
    attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
    order: BASE_ENTITY_ORDER_ASC,
  },
}))
export class CaseTypeModel extends BaseEntityModel {
  @HasMany(() => CaseCategoryModel)
  categories!: CaseCategoryModel[]
}
