import { Column, DataType } from 'sequelize-typescript'
import { BaseModel, BaseModelWithAttributes } from './base.model'

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

export class BaseEntityModel extends BaseModel<
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
}
