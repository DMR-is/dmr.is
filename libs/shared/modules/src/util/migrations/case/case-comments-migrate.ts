import { CaseComments } from '@dmr.is/shared/dto'

import { CaseCommentsDto } from '../../../case/models'
import { caseCommentMigrate } from './case-comment-migrate'

export const caseCommentsMigrate = (model: CaseCommentsDto): CaseComments => {
  return {
    caseComment: caseCommentMigrate(model.caseComment),
    // Todo add case here?
  }
}
