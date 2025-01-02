import { CaseOverviewStatus, CaseStatusEnum } from '@dmr.is/shared/dto'

type CaseOverviewStatusModel = {
  id: string
  title: string
  slug: string
  count: number
}

export const caseOverviewStatusMigrate = (
  model: CaseOverviewStatusModel,
): CaseOverviewStatus => {
  return {
    id: model.id,
    title: model.title as CaseStatusEnum,
    slug: model.slug,
    count: model.count,
  }
}
