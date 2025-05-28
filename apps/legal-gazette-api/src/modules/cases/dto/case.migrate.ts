import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { caseCategoryMigrate } from '../../case-category/dto/case-category.migrate'
import { CaseModel } from '../cases.model'
import { CaseDto } from './case.dto'

export const caseMigrate = (model: CaseModel): CaseDto => ({
  id: model.id,
  applicationId: model?.applicationId,
  caseNumber: model.caseNumber,
  category: caseCategoryMigrate(model.category),
  status: baseEntityMigrate(model.status),
  type: baseEntityMigrate(model.type),
  schedueledAt: model.scheduledAt ? model.scheduledAt.toISOString() : null,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})
