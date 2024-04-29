import {
  Column,
  CreatedAt,
  DataType,
  Model,
  NotNull,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

@Table({ tableName: 'advert_involved_party', timestamps: false })
export class AdvertInvolvedPartyDTO extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column
  @NotNull
  title!: string

  @Column
  @NotNull
  slug!: string

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
