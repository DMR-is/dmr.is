import { CaseComment, CaseCommentSourceEnum } from '@dmr.is/shared-dto'
import { mapSourceToDirection } from '@dmr.is/utils/server/serverUtils'

import { caseStatusMigrate } from '../../../case/migrations/case-status.migrate'
import { CaseCommentModel } from '../models'

export const convertDateToDaysAgo = (dateIso: string): string => {
  try {
    const date = new Date(dateIso)

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 3600 * 24))

    if (diffDays === 0) {
      return 'Í dag'
    }

    if (diffDays === 1) {
      return 'í gær'
    }

    return `f. ${diffDays} dögum`
  } catch (error) {
    return 'Ekki vitað'
  }
}

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
    state: model.applicationState ?? null,
  }
}
