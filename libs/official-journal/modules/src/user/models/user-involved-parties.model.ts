// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { AdvertInvolvedPartyModel as AdvertInvolvedPartyModelRef } from '../../journal/models'
import { AdvertInvolvedPartyModel } from '../../journal/models'
import type { UserModel as UserModelRef } from './user.model'
import { UserModel } from './user.model'

@Table({ tableName: 'user_involved_parties', timestamps: false })
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
  involvedParties!: AdvertInvolvedPartyModelRef

  @BelongsTo(() => UserModel)
  user!: UserModelRef
}
