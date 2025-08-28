import { FindOptions } from 'sequelize'
import {
  BeforeCreate,
  BeforeFind,
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

  @BeforeCreate
  static logBeforeCreate(
    instance: BaseModelWithAttributes<BaseModelAttributes>,
  ): void {
    this.logger.debug('Creating entity', {
      context: this.name,
      id: instance.id,
    })
  }

  @BeforeFind
  static logbeforeFind(_options: FindOptions): void {
    this.logger.debug('Looking for entities', {
      context: this.name,
    })
  }

  static get logger() {
    return getLogger(this.name)
  }
}
