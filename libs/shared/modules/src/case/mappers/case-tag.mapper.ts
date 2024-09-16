import { CaseTagEnum } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

export const caseTagMapper = (status: string) => {
  return withTryCatch(() => {
    switch (status) {
      case CaseTagEnum.InReview:
        return CaseTagEnum.InReview
      case CaseTagEnum.MultipleReviewers:
        return CaseTagEnum.MultipleReviewers
      case CaseTagEnum.NotStarted:
        return CaseTagEnum.NotStarted
      case CaseTagEnum.RequiresReview:
        return CaseTagEnum.RequiresReview
    }

    throw new Error(`Case tag<${status}> not found`)
  }, `Failed to migrate case tag with title: ${status}`)
}
