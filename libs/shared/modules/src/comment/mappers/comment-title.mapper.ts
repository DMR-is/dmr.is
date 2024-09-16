import { CaseCommentTitleEnum } from '@dmr.is/shared/dto'
import { isEnum, withTryCatch } from '@dmr.is/utils'

export const caseCommentTitleMapper = (type: string): CaseCommentTitleEnum => {
  return withTryCatch(() => {
    const result = isEnum(type, CaseCommentTitleEnum)

    if (result) {
      return result
    }

    throw new Error(`Case comment title<${type}> not found`)
  }, `Failed to migrate case comment title with type: ${type}`)
}
