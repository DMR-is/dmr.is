import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'
export enum CaseStatusSlug {
  SUBMITTED = 'innsent',
  READY_FOR_PUBLICATION = 'tilbuid-til-utgafu',
  PUBLISHED = 'utgefid',
  REJECTED = 'hafnad',
}

@BaseEntityTable({ tableName: LegalGazetteModels.CASE_STATUS })
export class CaseStatusModel extends BaseEntityModel {}
