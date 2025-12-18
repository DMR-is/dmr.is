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
import { ApiProperty } from '@nestjs/swagger'

import { getLogger } from '@dmr.is/logging'

export interface BaseModelAttributes {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface BaseModelStatic<T extends BaseModel = BaseModel>
  extends ModelStatic<T> {
  findByPkOrThrow(
    this: ModelStatic<T>,
    id: string,
    options?: Omit<FindOptions<T>, 'where'>,
  ): Promise<T>
  findOneOrThrow<T extends BaseModel>(
    this: ModelStatic<T>,
    options: FindOptions<T>,
    errorMessage?: string,
  ): Promise<T>
}

export abstract class BaseModel<
  TAttributes = any,
  TCreateAttributes extends {} = any,
> extends Model<TAttributes & BaseModelAttributes, TCreateAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  @ApiProperty({ type: String })
  declare id: string

  @CreatedAt
  declare createdAt: Date

  @UpdatedAt
  declare updatedAt: Date

  @DeletedAt
  declare deletedAt: Date | null

  @BeforeCreate
  static logBeforeCreate(instance: BaseModel): void {
    this.logger.debug('Creating entity', {
      context: this.name,
      id: instance.id,
    })
  }

  @BeforeFind
  static logBeforeFind(): void {
    this.logger.debug('Looking for entities', {
      context: this.name,
    })
  }

  static get logger() {
    return getLogger(this.name)
  }

  static withScope<T extends BaseModel>(
    this: ModelStatic<T>,
    ...scopes: Parameters<ModelStatic<T>['scope']>
  ): BaseModelStatic<T> {
    return this.scope(...scopes) as BaseModelStatic<T>
  }

  static async findOneOrThrow<T extends BaseModel>(
    this: ModelStatic<T>,
    options: FindOptions<T>,
    errorMessage = 'Entity not found',
  ): Promise<T> {
    const result = await this.findOne(options)
    if (!result) throw new NotFoundException(errorMessage)
    return result
  }

  static async findByPkOrThrow<T extends BaseModel>(
    this: ModelStatic<T>,
    id: string,
    options?: Omit<FindOptions<T>, 'where'>,
  ): Promise<T> {
    const result = await this.findByPk(id, options)
    if (!result) throw new NotFoundException('Entity not found')
    return result
  }
}
