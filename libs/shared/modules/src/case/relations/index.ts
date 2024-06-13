import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../../comment/models'
import { AdvertDepartmentDTO, AdvertTypeDTO } from '../../journal/models'
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
  AdvertTypeDTO,
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
