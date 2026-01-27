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
  static logBeforeFind(options: FindOptions): void {
    const opts = options as Record<string, unknown>
    const includeMap = opts.includeMap as
      | Record<string, Record<string, unknown>>
      | undefined

    this.logger.debug(`Executing query on ${this.name}`, {
      context: this.name,
      query: {
        model: (opts.model as { name?: string } | undefined)?.name,
        attributes: options.attributes,
        where: options.where,
        limit: options.limit,
        offset: options.offset,
        order: options.order,
        group: options.group,
        includeNames: opts.includeNames,
        includeDetails: includeMap
          ? Object.keys(includeMap).map((key) => {
              const inc = includeMap[key]
              return {
                as: inc?.as,
                model: (inc?.model as { name?: string } | undefined)?.name,
                required: inc?.required,
                separate: inc?.separate,
                attributes: inc?.attributes,
                where: inc?.where,
                limit: inc?.limit,
                order: inc?.order,
              }
            })
          : undefined,
        hasJoin: opts.hasJoin,
        hasSingleAssociation: opts.hasSingleAssociation,
        hasMultiAssociation: opts.hasMultiAssociation,
        subQuery: options.subQuery,
        required: opts.required,
        rejectOnEmpty: opts.rejectOnEmpty,
        transactionId: (options.transaction as { id?: string } | undefined)?.id,
      },
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
    errorMessage?: string,
  ): Promise<T> {
    const result = await this.findOne(options)

    if (!result)
      throw new NotFoundException(errorMessage || `${this.name} not found`)
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
