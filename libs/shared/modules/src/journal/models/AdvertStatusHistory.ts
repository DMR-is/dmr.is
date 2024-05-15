import {
  Column,
  CreatedAt,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdvertDTO } from './Advert'
import { AdvertStatusDTO } from './AdvertStatus'

@Table({ tableName: 'advert_status_history', timestamps: false })
export class AdvertStatusHistoryDTO extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUIDV4, allowNull: false })
  advert_id!: string

  @HasOne(() => AdvertDTO, 'id')
  advert!: AdvertDTO

  @Column({ type: DataType.UUIDV4, allowNull: false })
  status_id!: string

  @HasOne(() => AdvertStatusDTO, 'id')
  status!: AdvertStatusDTO

  @CreatedAt
  created!: Date
}
