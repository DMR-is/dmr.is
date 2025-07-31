import { Column, DataType, HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { CategoryModel } from '../category/category.model'
import { TypeDto } from './dto/type.dto'

export enum TypeIdEnum {
  COMMON_ADVERT = 'a58fe2a8-b0a9-47bd-b424-4b9cece0e622',
  BANKRUPTCY_ADVERT = '67cd8559-ea7a-45ae-8de1-e87005c35531',
  BANKRUPTCY_DIVISION_ADVERT = '7c2db6e3-9aa9-49bf-8044-b072cfc82d8a',
  DECEASED_DIVISION_ADVERT = 'f6f0b9e8-f32b-459a-b3b9-32eb4d211ea2',
}

export enum TypeEnum {
  COMMON_ADVERT = 'Almenn auglýsing',
  BANKRUPTCY_ADVERT = 'Innköllun þrotabús',
  BANKRUPTCY_DIVISION_ADVERT = 'Skiptafundur þrotabús',
  DECEASED_ADVERT = 'Innköllun dánarbús',
}

@BaseEntityTable({ tableName: LegalGazetteModels.ADVERT_TYPE })
export class TypeModel extends BaseEntityModel<TypeDto> {
  @HasMany(() => CategoryModel)
  categories!: CategoryModel[]

  @Column({
    type: DataType.ENUM(...Object.values(TypeEnum)),
    field: 'title',
    allowNull: false,
  })
  title!: TypeEnum
}
