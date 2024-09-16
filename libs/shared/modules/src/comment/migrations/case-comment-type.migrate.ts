import { CaseCommentType } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { caseCommentTypeMapper } from '../mappers/comment-type.mapper'
import { CaseCommentTypeModel } from '../models'

export const caseCommentTypeMigrate = (
  model: CaseCommentTypeModel,
): CaseCommentType => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: caseCommentTypeMapper(model.slug),
      slug: model.slug,
    }
  }, `Failed to migrate case comment type with id: ${model.id}`)
}
