import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
  Table,
} from 'sequelize-typescript'

import {
  BASE_ENTITY_ATTRIBUTES,
  BASE_ENTITY_ATTRIBUTES_DETAILED,
  BASE_ENTITY_ORDER_ASC,
  LegalGazetteModels,
} from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

import { CaseTypeModel } from '../case-type/case-type.model'

@Table({
  tableName: LegalGazetteModels.CASE_CATEGORY,
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
export class CaseCategoryModel extends BaseEntityModel {
  @ForeignKey(() => CaseTypeModel)
  @Column({ type: DataType.UUID, field: 'case_type_id' })
  typeId!: string

  @BelongsTo(() => CaseTypeModel)
  type!: CaseTypeModel
}
