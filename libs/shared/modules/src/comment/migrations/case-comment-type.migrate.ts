import { CaseCommentType, CaseCommentTypeEnum } from '@dmr.is/shared/dto'
import { enumMapper, withTryCatch } from '@dmr.is/utils'

import { CaseCommentTypeModel } from '../models'

export const caseCommentTypeMigrate = (
  model: CaseCommentTypeModel,
): CaseCommentType => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: enumMapper(model.slug, CaseCommentTypeEnum),
      slug: model.slug,
    }
  }, `Failed to migrate case comment type with id: ${model.id}`)
}
