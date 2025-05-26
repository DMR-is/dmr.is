import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

@BaseEntityTable({ tableName: LegalGazetteModels.CASE_STATUS })
export class CaseStatusModel extends BaseEntityModel {}
