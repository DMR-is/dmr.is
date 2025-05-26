import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import {
  BASE_ENTITY_ATTRIBUTES,
  BASE_ENTITY_ATTRIBUTES_DETAILED,
  BASE_ENTITY_ORDER_ASC,
  BaseEntityModel,
  BaseEntityTable,
} from '@dmr.is/shared/models/base'

import { CaseTypeModel } from '../case-type/case-type.model'

@DefaultScope(() => ({
  attributes: [...BASE_ENTITY_ATTRIBUTES, 'typeId'],
  include: [{ model: CaseTypeModel }],
  order: BASE_ENTITY_ORDER_ASC,
}))
@Scopes(() => ({
  detailed: {
    attributes: [...BASE_ENTITY_ATTRIBUTES_DETAILED, 'typeId'],
    include: [
      {
        model: CaseTypeModel,
        attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
      },
    ],
    order: BASE_ENTITY_ORDER_ASC,
  },
  byType: (slug?: string) => {
    return {
      include: [{ model: CaseTypeModel, where: slug ? { slug } : {} }],
    }
  },
}))
export class CaseCategoryModel extends BaseEntityModel {
  @ForeignKey(() => CaseTypeModel)
  @Column({ type: DataType.UUID, field: 'case_type_id' })
  typeId!: string

  @BelongsTo(() => CaseTypeModel)
  type!: CaseTypeModel
}
