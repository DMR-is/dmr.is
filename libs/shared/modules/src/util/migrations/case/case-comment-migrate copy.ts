import { CaseComments } from '@dmr.is/shared/dto'

import { CaseCommentsDto } from '../../../case/models'
import { caseCommentMigrate } from './case-comment-migrate'

export const caseCommentsMigrate = (model: CaseCommentsDto): CaseComments => {
  console.log(model.case)
  console.log(model.case_comment)

  return {
    caseComment: caseCommentMigrate(model.case_comment),
  }
}
