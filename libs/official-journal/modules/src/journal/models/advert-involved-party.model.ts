import {
  Column,
  CreatedAt,
  DataType,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

@Table({ tableName: 'advert_involved_party', timestamps: false })
export class AdvertInvolvedPartyModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string

  @Column({ allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({ allowNull: false })
  slug!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: null,
    field: 'is_primary',
  })
  isPrimary?: boolean | null

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
