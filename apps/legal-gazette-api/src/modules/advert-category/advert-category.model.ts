import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertModel } from '../advert/advert.model'
import { AdvertTypeModel } from '../advert-type/advert-type.model'

@BaseEntityTable({
  tableName: LegalGazetteModels.ADVERT_CATEGORY,
})
export class AdvertCategoryModel extends BaseEntityModel {
  @ForeignKey(() => AdvertTypeModel)
  @Column({ type: DataType.UUID, field: 'advert_type_id' })
  typeId!: string

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModel

  static async setAdvertCategory(advertId: string, categoryId: string) {
    await AdvertModel.update({ categoryId }, { where: { id: advertId } })
  }
}
