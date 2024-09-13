import { CaseCommentTask } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { userMapper } from '../../helpers/mappers/user.mapper'
import { CaseCommentTaskModel } from '../models'
import { caseCommentTitleMigrate } from './case-comment-title.migrate'

export const caseCommentTaskMigrate = (
  model: CaseCommentTaskModel,
): CaseCommentTask => {
  return withTryCatch(() => {
    return {
      from: userMapper(model.fromId),
      to: userMapper(model.toId),
      comment: model.comment,
      title: caseCommentTitleMigrate(model.title),
    }
  }, `Failed to migrate case comment task with id: ${model.id}`)
}
