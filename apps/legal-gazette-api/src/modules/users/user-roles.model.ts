import { HasMany } from 'sequelize-typescript'

import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { UserModel } from './users.model'

@BaseEntityTable({ tableName: LegalGazetteModels.USER_ROLES })
export class UserRoleModel extends BaseEntityModel {
  @HasMany(() => UserModel, { foreignKey: 'userRoleId' })
  users!: UserModel[]
}
