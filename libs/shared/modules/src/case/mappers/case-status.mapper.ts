import { CaseOverviewTotalItems, CaseStatusEnum } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { CaseModel } from '../models'

type StatusResMapper = {
  [key: string]: string
}

interface Result {
  [key: string]: number
}

export const caseStatusMapper = (status: string) => {
  return withTryCatch(() => {
    switch (status) {
      case CaseStatusEnum.Submitted:
        return CaseStatusEnum.Submitted
      case CaseStatusEnum.InProgress:
        return CaseStatusEnum.InProgress
      case CaseStatusEnum.InReview:
        return CaseStatusEnum.InReview
      case CaseStatusEnum.ReadyForPublishing:
        return CaseStatusEnum.ReadyForPublishing
      case CaseStatusEnum.Published:
        return CaseStatusEnum.Published
      case CaseStatusEnum.Rejected:
        return CaseStatusEnum.Rejected
      case CaseStatusEnum.Unpublished:
        return CaseStatusEnum.Unpublished
    }

    throw new Error(`Case status<${status}> not found`)
  }, `Failed to migrate case status with title: ${status}`)
}

export const statusResMapper: StatusResMapper = {
  [CaseStatusEnum.ReadyForPublishing]: 'ready',
  [CaseStatusEnum.Submitted]: 'submitted',
  [CaseStatusEnum.InReview]: 'inReview',
  [CaseStatusEnum.InProgress]: 'inProgress',
}

export const counterResult = (counter: CaseModel[]) => {
  const result: Result = counter.reduce((acc: Result, item) => {
    const { caseStatusValue, count } = item.dataValues
    const mappedStatus = statusResMapper[caseStatusValue]
    if (mappedStatus) {
      acc[mappedStatus] = (acc[mappedStatus] || 0) + parseInt(count, 10)
    }
    return acc
  }, {})

  return {
    submitted: result.submitted ?? 0,
    inProgress: result.inProgress ?? 0,
    inReview: result.inReview ?? 0,
    ready: result.ready ?? 0,
  } as CaseOverviewTotalItems
}
