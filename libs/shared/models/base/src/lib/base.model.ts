import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  UpdatedAt,
} from 'sequelize-typescript'

import { getLogger } from '@dmr.is/logging'

type BaseModelCreateAttributes = {}

type BaseModelAttributes = {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type BaseModelWithAttributes<T> = T & BaseModelAttributes

export class BaseModel<
  ModelAttributes,
  ModelCreateAttributes extends BaseModelCreateAttributes,
> extends Model<
  BaseModelWithAttributes<ModelAttributes>,
  ModelCreateAttributes
> {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
  id!: string

  @CreatedAt
  createdAt!: Date

  @UpdatedAt
  updatedAt!: Date

  @DeletedAt
  deletedAt!: Date | null

  static get logger() {
    return getLogger(this.name)
  }
}
