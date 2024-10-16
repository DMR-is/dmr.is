import { CaseStatusModel } from '../../case/models'
import { CaseCommentModel, CaseCommentTypeModel } from '../models'

/**
 * Get case comments relations
 * @param internal - Internal flag - if not set, all comments are returned
 * @returns Case comments relations
 */
export const getCaseCommentsRelations = (internal?: boolean) => {
  const whereParams =
    typeof internal === 'boolean' ? { internal: internal } : {}

  return [
    {
      model: CaseCommentModel,
      where: whereParams,
      include: [CaseCommentTypeModel, CaseStatusModel],
    },
  ]
}
