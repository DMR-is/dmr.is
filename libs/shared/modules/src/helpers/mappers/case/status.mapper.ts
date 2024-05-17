import { CaseStatus } from '@dmr.is/shared/dto'

export const caseStatusMapper = (status?: string | null) => {
  if (!status) return null

  switch (status) {
    case CaseStatus.Submitted:
      return CaseStatus.Submitted
    case CaseStatus.InProgress:
      return CaseStatus.InProgress
    case CaseStatus.InReview:
      return CaseStatus.InReview
    case CaseStatus.ReadyForPublishing:
      return CaseStatus.ReadyForPublishing
    case CaseStatus.Published:
      return CaseStatus.Published
    case CaseStatus.Rejected:
      return CaseStatus.Rejected
    case CaseStatus.Unpublished:
      return CaseStatus.Unpublished
  }

  return null
}
