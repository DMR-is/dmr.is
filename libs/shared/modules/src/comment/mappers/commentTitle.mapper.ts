import { CaseCommentTitleEnum } from '@dmr.is/shared/dto'

export const caseCommentTitleMapper = (
  type?: string | null,
): CaseCommentTitleEnum | null => {
  if (!type) return null

  switch (type) {
    case CaseCommentTitleEnum.Assign:
      return CaseCommentTitleEnum.Assign
    case CaseCommentTitleEnum.AssignSelf:
      return CaseCommentTitleEnum.AssignSelf
    case CaseCommentTitleEnum.Comment:
      return CaseCommentTitleEnum.Comment
    case CaseCommentTitleEnum.Message:
      return CaseCommentTitleEnum.Message
    case CaseCommentTitleEnum.Submit:
      return CaseCommentTitleEnum.Submit
    case CaseCommentTitleEnum.UpdateStatus:
      return CaseCommentTitleEnum.UpdateStatus
  }

  return null
}
