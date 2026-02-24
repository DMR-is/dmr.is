import { CaseStatus, CaseStatusEnum } from '@dmr.is/shared-dto'
import { enumMapper, withTryCatch } from '@dmr.is/utils/server/serverUtils'

import { CaseStatusModel } from '../models'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => {
  return withTryCatch(() => {
    return {
      id: model.id,
      title: enumMapper(model.title, CaseStatusEnum),
      slug: model.slug,
    }
  }, `Failed to migrate case status with id: ${model.id}`)
}
