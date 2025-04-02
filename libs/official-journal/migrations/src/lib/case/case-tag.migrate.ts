import { CaseTag } from '@dmr.is/official-journal/dto/case-tag/case-tag.dto'
import { CaseTagModel } from '@dmr.is/official-journal/models'

export const caseTagMigrate = (model: CaseTagModel): CaseTag => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
})
