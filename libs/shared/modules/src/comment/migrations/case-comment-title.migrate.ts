import { CaseCommentTitle } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { CaseCommentTitleModel } from '../models'

export const caseCommentTitleMigrate = (
  model: CaseCommentTitleModel,
): CaseCommentTitle => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
    }
  }, `Failed to migrate case comment title with id: ${model.id}`)
}
