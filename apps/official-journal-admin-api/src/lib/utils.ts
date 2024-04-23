import { CaseCommentTitle, CaseCommentType } from '@dmr.is/shared/dto'

export const mapCaseCommentTypeToCaseCommentTitle = (val?: string) => {
  if (!val) {
    return null
  }

  // TODO: CaseCommentType.AssignSelf is missing from the switch statement
  switch (val) {
    case CaseCommentType.Comment:
      return CaseCommentTitle.Comment
    case CaseCommentType.Message:
      return CaseCommentTitle.Message
    case CaseCommentType.Assign:
      return CaseCommentTitle.Assign
    case CaseCommentType.Submit:
      return CaseCommentTitle.Submit
    case CaseCommentType.Update:
      return CaseCommentTitle.UpdateStatus
    default:
      return null
  }
}
