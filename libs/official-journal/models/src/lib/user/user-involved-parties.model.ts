import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { UserModel } from './user.model'

import { OfficialJournalModels } from '../constants'
import { AdvertInvolvedPartyModel } from '../institution/institution.model'

@Table({
  tableName: OfficialJournalModels.USER_INVOLVED_PARTIES,
  timestamps: false,
})
export class UserInvolvedPartiesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUIDV4,
    field: 'user_id',
  })
  userId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUIDV4,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @BelongsTo(() => AdvertInvolvedPartyModel)
  involvedParties!: AdvertInvolvedPartyModel

  @BelongsTo(() => UserModel)
  user!: UserModel
}
