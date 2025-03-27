import { CaseStatusEnum } from './dto/case-constants'
export const getNextStatus = (status: CaseStatusEnum): CaseStatusEnum => {
  switch (status) {
    case CaseStatusEnum.Submitted:
      return CaseStatusEnum.InProgress
    case CaseStatusEnum.InProgress:
      return CaseStatusEnum.InReview
    case CaseStatusEnum.InReview:
      return CaseStatusEnum.ReadyForPublishing
  }

  return status
}

export const getPreviousStatus = (status: CaseStatusEnum): CaseStatusEnum => {
  switch (status) {
    case CaseStatusEnum.InProgress:
      return CaseStatusEnum.Submitted
    case CaseStatusEnum.InReview:
      return CaseStatusEnum.InProgress
    case CaseStatusEnum.ReadyForPublishing:
      return CaseStatusEnum.InReview
  }

  return status
}
