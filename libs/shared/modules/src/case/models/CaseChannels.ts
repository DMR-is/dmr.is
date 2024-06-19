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

import { CaseChannelDto, CaseDto } from '../../case/models'

@Table({ tableName: 'case_channels', timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseChannelsDto extends Model {
  @PrimaryKey
  @ForeignKey(() => CaseDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @PrimaryKey
  @ForeignKey(() => CaseChannelDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_channel_id',
  })
  channelId!: string

  @BelongsTo(() => CaseDto)
  case!: CaseDto

  @BelongsTo(() => CaseChannelDto)
  caseChannel!: CaseChannelDto
}
