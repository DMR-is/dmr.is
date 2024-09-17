import { CaseTag, CaseTagEnum } from '@dmr.is/shared/dto'
import { enumMapper, withTryCatch } from '@dmr.is/utils'

import { CaseTagModel } from '../models'

export const caseTagMigrate = (model: CaseTagModel): CaseTag => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: enumMapper(model.title, CaseTagEnum),
      slug: model.slug,
    }
  }, `Error migrating case tag ${model.id}`)
}
