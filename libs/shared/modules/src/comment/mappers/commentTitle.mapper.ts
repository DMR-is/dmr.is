import { CaseCommentTitleEnum } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

export const caseCommentTitleMapper = (type: string): CaseCommentTitleEnum => {
  return withTryCatch(() => {
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

    throw new Error(`Case comment title<${type}> not found`)
  }, `Failed to migrate case comment title with type: ${type}`)
}
