import { CaseTag } from '@dmr.is/shared/dto'

export const caseTagMapper = (status?: string | null) => {
  if (!status) return null

  switch (status) {
    case CaseTag.InReview:
      return CaseTag.InReview
    case CaseTag.MultipleReviewers:
      return CaseTag.MultipleReviewers
    case CaseTag.NotStarted:
      return CaseTag.NotStarted
    case CaseTag.RequiresReview:
      return CaseTag.RequiresReview
  }

  return null
}
