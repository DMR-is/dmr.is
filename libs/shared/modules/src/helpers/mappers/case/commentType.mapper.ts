import { CaseCommentType } from '@dmr.is/shared/dto'

export const caseCommentTypeMapper = (type?: string | null) => {
  if (!type) return null

  switch (type) {
    case CaseCommentType.Assign:
      return CaseCommentType.Assign
    case CaseCommentType.AssignSelf:
      return CaseCommentType.AssignSelf
    case CaseCommentType.Comment:
      return CaseCommentType.Comment
    case CaseCommentType.Message:
      return CaseCommentType.Message
    case CaseCommentType.Submit:
      return CaseCommentType.Submit
    case CaseCommentType.Update:
      return CaseCommentType.Update
  }

  return null
}
