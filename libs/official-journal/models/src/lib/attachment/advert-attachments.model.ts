import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.ADVERT_ATTACHMENTS,
  timestamps: true,
})
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated', 'modified'],
  },
}))
export class AdvertAttachmentsModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUIDV4, allowNull: false })
  advertId!: string

  @Column({ allowNull: false })
  name!: string

  @Column({ allowNull: false })
  type!: string

  @Column({ allowNull: false })
  url!: string
}
