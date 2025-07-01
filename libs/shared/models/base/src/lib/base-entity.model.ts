import { Column, DataType } from 'sequelize-typescript'

import { BaseModel, BaseModelWithAttributes } from './base.model'
import { BaseEntityTable } from './decorators'

type BaseEntityModelCreateAttributes = {
  title: string
  slug: string
}

export type BaseEntityModelAttributes =
  BaseModelWithAttributes<BaseEntityModelCreateAttributes>

export type BaseEntityAttributes = Pick<
  BaseEntityModelAttributes,
  'id' | 'title' | 'slug'
>

export type BaseEntityAttributesDetailed = BaseEntityModelAttributes

@BaseEntityTable()
export class BaseEntityModel<
  ReturnDtoType = BaseEntityAttributes,
> extends BaseModel<
  BaseEntityModelAttributes,
  BaseEntityModelCreateAttributes
> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string

  // static fromModel(model: BaseEntityModel): ReturnDtoType {
  //   try {
  //     return {
  //       id: model.id,
  //       title: model.title,
  //       slug: model.slug,
  //     }
  //   } catch (error) {
  //     this.logger.debug(
  //       `fromModel failed from model ${this.constructor.name}`,
  //       error,
  //     )
  //     throw error
  //   }
  // }

  fromModel(): ReturnDtoType {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
    } as ReturnDtoType
  }
}
