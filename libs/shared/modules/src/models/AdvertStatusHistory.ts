import {
  Column,
  CreatedAt,
  DataType,
  HasOne,
  Model,
  NotNull,
  Table,
} from 'sequelize-typescript'

import { Advert } from './Advert'
import { AdvertStatus } from './AdvertStatus'

@Table({ tableName: 'advert_status_history', timestamps: false })
export class AdvertStatusHistory extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUIDV4 })
  @NotNull
  advert_id!: string

  @HasOne(() => Advert, 'advert_id')
  advert!: Advert

  @Column({ type: DataType.UUIDV4 })
  @NotNull
  status_id!: string

  @HasOne(() => AdvertStatus, 'status_id')
  status!: AdvertStatus

  @CreatedAt
  created!: Date
}
