import { Column, DataType } from 'sequelize-typescript'

import { BaseModel, BaseModelAttributes } from './base.model'
import { BaseEntityTable } from './decorators'

type BaseEntityModelCreateAttributes = {
  title: string
  slug: string
}

export type BaseEntityModelAttributes = BaseModelAttributes &
  BaseEntityModelCreateAttributes

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

  fromModel(): ReturnDtoType {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
    } as ReturnDtoType
  }
}
