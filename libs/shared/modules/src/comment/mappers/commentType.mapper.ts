import { CaseCommentTypeEnum } from '@dmr.is/shared/dto'

export const caseCommentTypeMapper = (
  type?: string | null,
): CaseCommentTypeEnum | null => {
  if (!type) return null

  switch (type) {
    case CaseCommentTypeEnum.Assign:
      return CaseCommentTypeEnum.Assign
    case CaseCommentTypeEnum.AssignSelf:
      return CaseCommentTypeEnum.AssignSelf
    case CaseCommentTypeEnum.Comment:
      return CaseCommentTypeEnum.Comment
    case CaseCommentTypeEnum.Message:
      return CaseCommentTypeEnum.Message
    case CaseCommentTypeEnum.Submit:
      return CaseCommentTypeEnum.Submit
    case CaseCommentTypeEnum.Update:
      return CaseCommentTypeEnum.Update
  }

  return null
}
