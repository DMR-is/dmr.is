import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../../comment/models'
import { AdvertDepartmentDTO } from '../../journal/models'
import {
  CaseCommunicationStatusDto,
  CaseStatusDto,
  CaseTagDto,
} from '../models'

export const CASE_RELATIONS = [
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
  AdvertDepartmentDTO,
  {
    model: CaseCommentDto,
    include: [
      {
        model: CaseCommentTaskDto,
        include: [CaseCommentTitleDto],
      },
      CaseStatusDto,
      CaseCommentTypeDto,
    ],
  },
]
