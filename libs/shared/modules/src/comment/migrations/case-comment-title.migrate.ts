import { CaseCommentTitle, CaseCommentTitleEnum } from '@dmr.is/shared/dto'
import { enumMapper, withTryCatch } from '@dmr.is/utils'

import { CaseCommentTitleModel } from '../models'

export const caseCommentTitleMigrate = (
  model: CaseCommentTitleModel,
): CaseCommentTitle => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: enumMapper(model.title, CaseCommentTitleEnum),
      slug: model.slug,
    }
  }, `Failed to migrate case comment title with id: ${model.id}`)
}
