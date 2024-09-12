import { CaseStatus } from '@dmr.is/shared/dto'

import { CaseStatusDto } from '../../../case/models'

export const caseStatusMigrate = (model: CaseStatusDto): CaseStatus => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
