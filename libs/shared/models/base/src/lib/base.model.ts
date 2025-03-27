import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  UpdatedAt,
} from 'sequelize-typescript'

type BaseModelCreateAttributes = {}

type BaseModelAttributes = {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type BaseModelWithAttributes<T> = T & BaseModelAttributes

export class BaseModel<
  ModelAttributes extends BaseModelAttributes,
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
}
