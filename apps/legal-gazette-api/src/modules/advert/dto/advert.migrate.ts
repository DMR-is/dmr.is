import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { advertCategoryMigrate } from '../../advert-category/dto/advert-category.migrate'
import { advertTypeMigrate } from '../../advert-type/dto/advert-type.migrate'
import { AdvertModel } from '../advert.model'
import { AdvertDetailedDto, AdvertDto } from './advert.dto'

export const advertMigrate = (model: AdvertModel): AdvertDto => ({
  id: model.id,
  caseId: model.caseId,
  title: model.title,
  html: model.html,
  publicationNumber: model.publicationNumber,
  scheduledAt: model.scheduledAt.toISOString(),
  publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
  version: model.version,
  category: advertCategoryMigrate(model.category),
  status: baseEntityMigrate(model.status),
  type: advertTypeMigrate(model.type),
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})

export const advertDetailedMigrate = (
  model: AdvertModel,
): AdvertDetailedDto => ({
  id: model.id,
  caseId: model.caseId,
  title: model.title,
  html: model.html,
  publicationNumber: model.publicationNumber,
  scheduledAt: model.scheduledAt.toISOString(),
  publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
  version: model.version,
  category: advertCategoryMigrate(model.category),
  status: baseEntityMigrate(model.status),
  type: advertTypeMigrate(model.type),
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
  commonAdvert: model.commonAdvert
    ? {
        caption: model.commonAdvert.caption,
        signature: {
          name: model.commonAdvert.signatureName,
          location: model.commonAdvert.signatureLocation,
          date: model.commonAdvert.signatureDate.toISOString(),
        },
      }
    : undefined,
})
