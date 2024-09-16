import { CaseTag } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { caseTagMapper } from '../mappers/case-tag.mapper'
import { CaseTagModel } from '../models'

export const caseTagMigrate = (model: CaseTagModel): CaseTag => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: caseTagMapper(model.title),
      slug: model.slug,
    }
  }, `Error migrating case tag ${model.id}`)
}
