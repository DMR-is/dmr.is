import { CaseStatus } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { CaseStatusModel } from '../models'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
    }
  }, `Failed to migrate case status with id: ${model.id}`)
}
