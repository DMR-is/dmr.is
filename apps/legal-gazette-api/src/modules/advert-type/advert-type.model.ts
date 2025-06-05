import { Column, DataType, HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { AdvertCategoryModel } from '../advert-category/advert-category.model'

export enum AdvertTypeIdEnum {
  COMMON_APPLICATION = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
}

export enum AdvertTypeSlugEnum {
  COMMON_APPLICATION = 'almenn-auglysing',
}

export enum AdvertTypeEnum {
  COMMON_APPLICATION = 'Almenn auglýsing',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_TYPE })
export class AdvertTypeModel extends BaseEntityModel {
  @HasMany(() => AdvertCategoryModel)
  categories!: AdvertCategoryModel[]

  @Column({
    type: DataType.ENUM(...Object.values(AdvertTypeEnum)),
    field: 'title',
    allowNull: false,
  })
  title!: AdvertTypeEnum
}
