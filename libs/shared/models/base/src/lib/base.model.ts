import {
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  UpdatedAt,
} from 'sequelize-typescript'

interface BaseAttributes {
  id: string
  created: Date
  updated: Date
  deleted: Date | null
}

export type BaseModelAttributes<T> = T & BaseAttributes

export class BaseModel<T> extends Model<BaseModelAttributes<T>> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
  })
  id!: string

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @DeletedAt
  deleted!: Date | null
}
