import { CaseStatus } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { caseStatusMapper } from '../mappers/case-status.mapper'
import { CaseStatusModel } from '../models'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: caseStatusMapper(model.title),
      slug: model.slug,
    }
  }, `Failed to migrate case status with id: ${model.id}`)
}
