import { CaseStatusEnum } from '@dmr.is/shared/dto'

type StatusResMapper = {
  [key: string]: string
}

export const statusResMapper: StatusResMapper = {
  [CaseStatusEnum.ReadyForPublishing]: 'ready',
  [CaseStatusEnum.Submitted]: 'submitted',
  [CaseStatusEnum.InReview]: 'inReview',
  [CaseStatusEnum.InProgress]: 'inProgress',
}
