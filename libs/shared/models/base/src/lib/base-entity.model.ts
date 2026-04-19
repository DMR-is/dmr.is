import { Column, DataType } from 'sequelize-typescript'

import { BaseEntityTable } from './decorators'
import { ParanoidModel, ParanoidModelAttributes } from './paranoid.model'

type BaseEntityModelCreateAttributes = {
  title: string
  slug: string
}

export type BaseEntityModelAttributes = ParanoidModelAttributes &
  BaseEntityModelCreateAttributes

export type BaseEntityAttributes = Pick<
  BaseEntityModelAttributes,
  'id' | 'title' | 'slug'
>

export type BaseEntityAttributesDetailed = BaseEntityModelAttributes

@BaseEntityTable()
export class BaseEntityModel<
  ReturnDtoType = BaseEntityAttributes,
> extends ParanoidModel<
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
