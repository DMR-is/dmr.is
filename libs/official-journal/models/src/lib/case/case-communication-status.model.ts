import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'
import { CaseCommunicationStatus } from '@dmr.is/shared/dto'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.CASE_COMMUNICATION_STATUS,
  timestamps: false,
})
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseCommunicationStatusModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: CaseCommunicationStatus

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
