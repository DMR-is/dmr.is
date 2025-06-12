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

  static fromModel(model: BaseEntityModel): BaseEntityAttributes {
    try {
      return {
        id: model.id,
        title: model.title,
        slug: model.slug,
      }
    } catch (error) {
      this.logger.debug(
        `fromModel failed from model ${this.constructor.name}`,
        error,
      )
      throw error
    }
  }

  fromModel(): BaseEntityAttributes {
    return BaseEntityModel.fromModel(this)
  }

  static fromModels(models: BaseEntityModel[]): BaseEntityAttributes[] {
    return models.map((model) => BaseEntityModel.fromModel(model))
  }
}
