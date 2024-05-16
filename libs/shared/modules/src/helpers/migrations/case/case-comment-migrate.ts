import { CaseComment } from '@dmr.is/shared/dto'

import { CaseCommentDto } from '../../../case/models/CaseComment'
import {
  caseCommentTitleMapper,
  caseCommentTypeMapper,
  caseStatusMapper,
} from '../../mappers'
import { userMapper } from '../../mappers/case/user.mapper'

export const caseCommentMigrate = (model: CaseCommentDto): CaseComment => {
  try {
    const status = caseStatusMapper(model.status.value)

    if (!status) {
      throw new Error(`Unknown case status: ${model.status.value}`)
    }

    const type = caseCommentTypeMapper(model.type.value)

    if (!type) {
      throw new Error(`Unknown case comment type: ${model.type.value}`)
    }

    const title = caseCommentTitleMapper(model.task.title.value)

    if (!title) {
      throw new Error(`Unknown case comment title: ${model.task.title.value}`)
    }

    const mapped = {
      id: model.id,
      internal: model.internal,
      createdAt: model.createdAt,
      caseStatus: status,
      type: type,
      task: {
        comment: model.task.comment,
        from: userMapper(model.task.fromId),
        to: model.task.toId,
        title: title,
      },
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case comment: ${e}`)
  }
}
