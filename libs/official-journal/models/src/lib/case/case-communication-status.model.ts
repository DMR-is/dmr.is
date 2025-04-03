import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'

export enum CaseCommunicationStatusEnum {
  NotStarted = 'Ekki hafin',
  WaitingForAnswers = 'Beðið eftir svörum',
  HasAnswers = 'Svör hafa borist',
  Done = 'Lokið',
}

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
  title!: CaseCommunicationStatusEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
