import { CaseStatus, CaseStatusEnum } from '@dmr.is/shared/dto'
import { enumMapper } from '@dmr.is/utils'

import { CaseStatusModel } from '../models'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => {
  return {
    id: model.id,
    title: enumMapper(model.title, CaseStatusEnum),
    slug: model.slug,
  }
}
