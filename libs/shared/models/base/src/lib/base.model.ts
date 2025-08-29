import { FindOptions, ModelStatic } from 'sequelize'
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

import { NotFoundException } from '@nestjs/common'

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
  TAttributes,
  TCreateAttributes extends BaseModelCreateAttributes,
  TModel extends BaseModel<TAttributes, TCreateAttributes, TModel> = any,
> extends Model<BaseModelWithAttributes<TAttributes>, TCreateAttributes> {
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

  static async findOneOrThrow<T extends BaseModel<any, any, any>>(
    this: ModelStatic<T>,
    options: FindOptions<T>,
  ): Promise<T> {
    const result = await this.findOne(options)

    if (!result) throw new NotFoundException('Entity not found')

    return result as T
  }

  static async findByPkOrThrow<T extends BaseModel<any, any, any>>(
    this: ModelStatic<T>,
    id: string,
    options?: Omit<FindOptions<T>, 'where'>,
  ): Promise<T> {
    const result = await this.findByPk(id, options)

    if (!result) throw new NotFoundException('Entity not found')

    return result as T
  }

  async findOneOrThrow(options: Omit<FindOptions<TModel>, 'where'>) {
    const modelClass = this.constructor as typeof BaseModel
    const result = await modelClass.findOne(options)

    if (!result) throw new NotFoundException('Entity not found')

    return result as TModel
  }

  async findByPkOrThrow(
    options?: Omit<FindOptions<TModel>, 'where'>,
  ): Promise<TModel> {
    const modelClass = this.constructor as typeof BaseModel
    const result = await modelClass.findByPk(this.id, options)

    if (!result) throw new NotFoundException('Entity not found')
    return result as TModel
  }
}
