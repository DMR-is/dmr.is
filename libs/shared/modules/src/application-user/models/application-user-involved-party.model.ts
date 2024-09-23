import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertInvolvedPartyModel } from '../../journal/models'
import { ApplicationUserModel } from './application-user.model'

@Table({ tableName: 'application_user_involved_party' })
export class ApplicationUserInvolvedPartyModel extends Model {
  @PrimaryKey
  @ForeignKey(() => ApplicationUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'application_user_id',
  })
  applicationUserId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @BelongsTo(() => ApplicationUserModel)
  applicationUser!: ApplicationUserModel

  @BelongsTo(() => AdvertInvolvedPartyModel)
  involvedParty!: AdvertInvolvedPartyModel
}
