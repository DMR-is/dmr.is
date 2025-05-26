import { LegalGazetteModels } from '@dmr.is/legal-gazette/constants'
import { BaseModel, BaseTable } from '@dmr.is/shared/models/base'

type CasePublicationDateAttributes = {
  caseId: string
  scheduledAt: Date
  publishedAt: Date | null
  version: number
}

type CasePublicationDateCreateAttributes = {
  caseId: string
  scheduledAt: Date
  publishedAt?: Date | null
}

@BaseTable({ tableName: LegalGazetteModels.CASE_PUBLICATION_DATES })
export class CasePublicationDateModel extends BaseModel<
  CasePublicationDateAttributes,
  CasePublicationDateCreateAttributes
> {}
