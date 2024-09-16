import { CaseComment } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { caseStatusMigrate } from '../../case/migrations/case-status.migrate'
import { userMapper } from '../../helpers/mappers/user.mapper'
import { CaseCommentModel } from '../models'
import { caseCommentTitleMigrate } from './case-comment-title.migrate'
import { caseCommentTypeMigrate } from './case-comment-type.migrate'

export const caseCommentMigrate = (model: CaseCommentModel): CaseComment => {
  return withTryCatch(() => {
    const mapped = {
      id: model.id,
      internal: model.internal,
      createdAt: model.createdAt,
      caseStatus: caseStatusMigrate(model.status),
      type: caseCommentTypeMigrate(model.type),
      state: model.state,
      task: {
        comment: model.task.comment,
        from: userMapper(model.task.fromId), // TODO user or institution
        to: userMapper(model.task.toId), // TODO user or institution
        title: caseCommentTitleMigrate(model.task.title),
      },
    }

    return mapped
  }, `Error migrating case comment<${model.id}>`)
}
