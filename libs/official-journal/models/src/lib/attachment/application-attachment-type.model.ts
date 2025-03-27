import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.APPLICATION_ATTACHMENT_TYPE,
  timestamps: false,
})
export class ApplicationAttachmentTypeModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
