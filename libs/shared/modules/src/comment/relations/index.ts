import { CaseStatusDto } from '../../case/models'
import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../models'

export const CASE_COMMENTS_RELATIONS = [
  {
    model: CaseCommentDto,
    include: [
      CaseCommentTypeDto,
      CaseStatusDto,
      { model: CaseCommentTaskDto, include: [CaseCommentTitleDto] },
    ],
  },
]
