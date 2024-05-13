import { CaseCommentTitle } from '@dmr.is/shared/dto'

export const caseCommentTitleMapper = (type?: string | null) => {
  if (!type) return null

  switch (type) {
    case CaseCommentTitle.Assign:
      return CaseCommentTitle.Assign
    case CaseCommentTitle.AssignSelf:
      return CaseCommentTitle.AssignSelf
    case CaseCommentTitle.Comment:
      return CaseCommentTitle.Comment
    case CaseCommentTitle.Message:
      return CaseCommentTitle.Message
    case CaseCommentTitle.Submit:
      return CaseCommentTitle.Submit
    case CaseCommentTitle.UpdateStatus:
      return CaseCommentTitle.UpdateStatus
  }

  return null
}
