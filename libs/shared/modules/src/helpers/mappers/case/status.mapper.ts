import { CaseOverviewTotalItems, CaseStatus } from '@dmr.is/shared/dto'

import { CaseDto } from '../../../case/models'

type StatusResMapper = {
  [key: string]: string;
};

interface Result {
  [key: string]: number;
}

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

export const statusResMapper: StatusResMapper = {
  [CaseStatus.ReadyForPublishing]: 'ready',
  [CaseStatus.Submitted]: 'submitted',
  [CaseStatus.InReview]: 'inReview',
  [CaseStatus.InProgress]: 'inProgress',
};

export const counterResult = (counter: CaseDto[]) => {
  const result: Result = counter.reduce((acc: Result, item) => {
    const { caseStatusValue, count } = item.dataValues;
    const mappedStatus = statusResMapper[caseStatusValue];
    if (mappedStatus) {
      acc[mappedStatus] = (acc[mappedStatus] || 0) + parseInt(count, 10);
    }
    return acc;
  }, {});

  return {
    submitted: result.submitted ?? 0,
    inProgress: result.inProgress ?? 0,
    inReview: result.inReview ?? 0,
    ready: result.ready ?? 0,
  } as CaseOverviewTotalItems
}
