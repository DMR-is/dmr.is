import { CaseDto } from './Case'
import { CaseCommentDto } from './CaseComment'
import { CaseCommentsDto } from './CaseComments'
import { CaseCommentTaskDto } from './CaseCommentTask'
import { CaseCommentTitleDto } from './CaseCommentTitle'
import { CaseCommentTypeDto } from './CaseCommentType'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

export {
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTypeDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommunicationStatusDto,
}

export const models = [
  CaseDto,
  CaseTagDto,
  CaseStatusDto,
  CaseCommentDto,
  CaseCommentsDto,
  CaseCommentTypeDto,
  CaseCommentTaskDto,
  CaseCommentTitleDto,
  CaseCommunicationStatusDto,
]

export default models
