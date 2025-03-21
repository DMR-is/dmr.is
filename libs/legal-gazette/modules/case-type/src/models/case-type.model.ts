import { Table } from 'sequelize-typescript'
import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel } from '@dmr.is/shared/models/base'

@Table({ tableName: LegalGazetteModels.CASE_TYPE })
export class CaseType extends BaseEntityModel {}
