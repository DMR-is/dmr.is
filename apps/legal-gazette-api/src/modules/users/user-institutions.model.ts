import { Column, DataType, ForeignKey, HasOne } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

import {
  InstitutionCreateAttributes,
  InstitutionModel,
} from '../institution/institution.model'
import { UserCreateAttributes, UserModel } from './users.model'

export type UserInstitutionAttributes = {
  userId: string
  institutionId: string
}

export type UserInstitutionCreateAttributes = {
  userId?: string
  institutionId?: string
  user?: UserCreateAttributes
  institution?: InstitutionCreateAttributes
}

@BaseTable({ tableName: LegalGazetteModels.USER_INSTITUTIONS })
export class UserInstitutionModel extends BaseModel<
  UserInstitutionAttributes,
  UserInstitutionCreateAttributes
> {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'user_id',
  })
  userId!: string

  @ForeignKey(() => InstitutionModel)
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'institution_id',
  })
  institutionId!: string

  @HasOne(() => UserModel, { foreignKey: 'userId' })
  user!: UserModel

  @HasOne(() => InstitutionModel, { foreignKey: 'institutionId' })
  institution!: InstitutionModel
}
