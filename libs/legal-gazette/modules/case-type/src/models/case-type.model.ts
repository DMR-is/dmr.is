import { DefaultScope, Index, Scopes, Table } from 'sequelize-typescript'

import {
  BASE_ENTITY_ATTRIBUTES,
  BASE_ENTITY_ATTRIBUTES_DETAILED,
  BASE_ENTITY_ORDER_ASC,
  LegalGazetteModels,
} from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

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
@Index({
  name: 'case_type_slug_unique',
  unique: true,
})
export class CaseTypeModel extends BaseEntityModel {}
