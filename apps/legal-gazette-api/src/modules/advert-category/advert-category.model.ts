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

import { AdvertTypeModel } from '../advert-type/advert-type.model'

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
@DefaultScope(() => ({
  attributes: [...BASE_ENTITY_ATTRIBUTES, 'typeId'],
  include: [{ model: AdvertTypeModel }],
  order: BASE_ENTITY_ORDER_ASC,
}))
@Scopes(() => ({
  detailed: {
    attributes: [...BASE_ENTITY_ATTRIBUTES_DETAILED, 'typeId'],
    include: [
      {
        model: AdvertTypeModel,
        attributes: BASE_ENTITY_ATTRIBUTES_DETAILED,
      },
    ],
    order: BASE_ENTITY_ORDER_ASC,
  },
  byType: (slug?: string) => {
    return {
      include: [{ model: AdvertTypeModel, where: slug ? { slug } : {} }],
    }
  },
}))
export class AdvertCategoryModel extends BaseEntityModel {
  @ForeignKey(() => AdvertTypeModel)
  @Column({ type: DataType.UUID, field: 'case_type_id' })
  typeId!: string

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModel
}
