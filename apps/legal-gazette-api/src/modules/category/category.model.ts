import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { TypeModel } from '../type/type.model'

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class CategoryModel extends BaseEntityModel {
  @ForeignKey(() => TypeModel)
  @Column({ type: DataType.UUID, field: 'advert_type_id' })
  typeId!: string

  @BelongsTo(() => TypeModel)
  type!: TypeModel

  static async setAdvertCategory(advertId: string, categoryId: string) {
    await AdvertModel.update({ categoryId }, { where: { id: advertId } })
  }
}
