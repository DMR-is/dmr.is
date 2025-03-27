import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from './case.model'
import { CaseChannelModel } from './case-channel.model'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.CASE_CHANNELS, timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseChannelsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => CaseChannelModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_channel_id',
  })
  channelId!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => CaseChannelModel)
  caseChannel!: CaseChannelModel
}
