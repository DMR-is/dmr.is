import { DefaultScope, Scopes, Table } from 'sequelize-typescript'
import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

@Table({ tableName: LegalGazetteModels.CASE_TYPE })
@DefaultScope(() => ({
  attributes: ['id', 'title', 'slug'],
  order: [['title', 'ASC']],
}))
@Scopes(() => ({
  full: {
    attributes: ['id', 'title', 'slug', 'createdAt', 'updatedAt', 'deletedAt'],
  },
}))
export class CaseType extends BaseEntityModel {}
