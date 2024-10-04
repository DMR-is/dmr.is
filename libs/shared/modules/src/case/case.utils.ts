import { CaseOverviewTotalItems, CaseStatusEnum } from '@dmr.is/shared/dto'

import { CaseModel } from './models'

type StatusResMapper = {
  [key: string]: string
}

interface Result {
  [key: string]: number
}

export const statusResMapper: StatusResMapper = {
  [CaseStatusEnum.ReadyForPublishing]: 'ready',
  [CaseStatusEnum.Submitted]: 'submitted',
  [CaseStatusEnum.InReview]: 'inReview',
  [CaseStatusEnum.InProgress]: 'inProgress',
}

export const counterResult = (counter: CaseModel[]) => {
  const result: Result = counter.reduce((acc: Result, item) => {
    const { count, caseStatusTitle } = item.dataValues

    const mappedStatus = statusResMapper[caseStatusTitle]
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
