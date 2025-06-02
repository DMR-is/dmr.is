import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { advertCategoryMigrate } from '../../advert-category/dto/advert-category.migrate'
import { CaseModel } from '../cases.model'
import { CaseDto } from './case.dto'

export const caseMigrate = (model: CaseModel): CaseDto => ({
  id: model.id,
  applicationId: model?.applicationId,
  caseNumber: model.caseNumber,
  category: advertCategoryMigrate(model.category),
  status: baseEntityMigrate(model.status),
  type: baseEntityMigrate(model.type),
  title: model.caseTitle,
  schedueledAt: model.scheduledAt ? model.scheduledAt.toISOString() : null,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})
