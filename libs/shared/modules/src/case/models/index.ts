import { CaseCommentDto } from './CaseComment'
import { CaseCommentTaskDto } from './CaseCommentTask'
import { CaseCommentTitleDto } from './CaseCommentTitle'
import { CaseCommentTypeDto } from './CaseCommentType'
import { CaseCommunicationStatusDto } from './CaseCommunicationStatus'
import { CaseStatusDto } from './CaseStatus'
import { CaseTagDto } from './CaseTag'

export const models = {
  CaseCommunicationStatusDto,
  CaseStatusDto,
  CaseTagDto,
  CaseCommentTitleDTO: CaseCommentTitleDto,
  CaseCommentTypeDto,
  CaseCommentTaskDto,
  CaseCommentDto,
}

export default models
