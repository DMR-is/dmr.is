import { CaseTagModel } from '@dmr.is/official-journal/models'
import { enumMapper } from '@dmr.is/utils'
import { CaseTagEnum } from '../dto/case-constants'
import { CaseTag } from '../dto/tag.dto'

export const caseTagMigrate = (model: CaseTagModel): CaseTag => {
  return {
    id: model.id,
    title: enumMapper(model.title, CaseTagEnum),
    slug: model.slug,
  }
}
