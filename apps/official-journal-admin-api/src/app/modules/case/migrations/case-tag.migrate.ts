import { CaseTagModel, CaseTagEnum } from '@dmr.is/official-journal/models'
import { enumMapper } from '@dmr.is/utils'
import { CaseTag } from '../dto/tag.dto'

export const caseTagMigrate = (model: CaseTagModel): CaseTag => {
  return {
    id: model.id,
    title: enumMapper(model.title, CaseTagEnum),
    slug: model.slug,
  }
}
