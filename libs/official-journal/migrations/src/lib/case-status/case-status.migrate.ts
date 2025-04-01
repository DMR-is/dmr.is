import { CaseStatus } from '@dmr.is/official-journal/dto/case-status/case-status.dto'
import { CaseStatusModel } from '@dmr.is/official-journal/models'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
})
