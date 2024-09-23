import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdvertInvolvedPartyModel } from '../../journal/models'
import { ApplicationUserInvolvedPartyModel } from './application-user-involved-party.model'

@Table({ tableName: 'application_user' })
export class ApplicationUserModel extends Model {
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
    field: 'national_id',
  })
  nationalId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'first_name',
  })
  firstName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'last_name',
  })
  lastName!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string

  @BelongsToMany(() => AdvertInvolvedPartyModel, {
    through: () => ApplicationUserInvolvedPartyModel,
  })
  involvedParties!: AdvertInvolvedPartyModel[]
}
