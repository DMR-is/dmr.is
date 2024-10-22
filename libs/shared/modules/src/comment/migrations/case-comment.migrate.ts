import { CaseComment, CaseCommentSourceEnum } from '@dmr.is/shared/dto'
import { convertDateToDaysAgo, mapSourceToDirection } from '@dmr.is/utils'

import { caseStatusMigrate } from '../../case/migrations/case-status.migrate'
import { CaseCommentModel } from '../models'

/**
 *
 * @param model The comment model
 * @param forSource Who is asking for the migration
 * @returns
 */
export const caseCommentMigrate = (
  model: CaseCommentModel,
  forSource: CaseCommentSourceEnum,
): CaseComment => {
  return {
    id: model.id,
    internal: model.internal,
    title: model.type.title,
    caseStatus: caseStatusMigrate(model.caseStatus).title,
    age: convertDateToDaysAgo(model.created),
    ageIso: model.created,
    direction: mapSourceToDirection(model.source, forSource),
    creator: model.creator,
    receiver: model.receiver,
    comment: model.comment,
  }
}
