import { CaseTagEnum } from '@dmr.is/shared/dto'

export const caseTagMapper = (status?: string | null) => {
  if (!status) return null

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

  return null
}
