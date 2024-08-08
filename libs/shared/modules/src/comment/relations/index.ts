import { CaseStatusDto } from '../../case/models'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../models'

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
      model: CaseCommentDto,
      where: whereParams,
      include: [
        CaseCommentTypeDto,
        CaseStatusDto,
        {
          model: CaseCommentTaskDto,
          include: [CaseCommentTitleDto],
        },
      ],
    },
  ]
}
