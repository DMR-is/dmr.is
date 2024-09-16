import { CaseCommentTypeEnum } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

export const caseCommentTypeMapper = (type: string): CaseCommentTypeEnum => {
  return withTryCatch(() => {
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
    throw new Error(`Case comment type<${type}> not found`)
  }, `Failed to migrate case comment type with id: ${type}`)
}
