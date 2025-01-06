import { CaseOverviewStatus, CaseStatusEnum } from '@dmr.is/shared/dto'

type CaseOverviewStatusModel = {
  title: string
  count: number
}

export const caseOverviewStatusMigrate = (
  model: CaseOverviewStatusModel,
): CaseOverviewStatus => {
  return {
    title: model.title as CaseStatusEnum,
    count: model.count,
  }
}
