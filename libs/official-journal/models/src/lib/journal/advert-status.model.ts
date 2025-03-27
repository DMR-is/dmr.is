import { Column, DataType, Model, Table } from 'sequelize-typescript'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.ADVERT_STATUS, timestamps: false })
export class AdvertStatusModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string
}
