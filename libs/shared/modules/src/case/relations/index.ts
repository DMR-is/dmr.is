import {
  CaseCommentDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommentTypeDto,
} from '../../comment/models'
import { AdvertDepartmentDTO } from '../../journal/models'
import {
  CaseChannelDto,
  CaseCommunicationStatusDto,
  CaseStatusDto,
  CaseTagDto,
} from '../models'

export const CASE_RELATIONS = [
  CaseTagDto,
  CaseStatusDto,
  CaseCommunicationStatusDto,
  AdvertDepartmentDTO,
  CaseChannelDto,
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
