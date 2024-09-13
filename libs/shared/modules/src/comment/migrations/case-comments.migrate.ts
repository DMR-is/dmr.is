import { CaseComments } from '@dmr.is/shared/dto'

import { CaseCommentsModel } from '../comment.module'
import { caseCommentMigrate } from './case-comment.migrate'

export const caseCommentsMigrate = (model: CaseCommentsModel): CaseComments => {
  return {
    caseComment: caseCommentMigrate(model.caseComment),
  }
}
