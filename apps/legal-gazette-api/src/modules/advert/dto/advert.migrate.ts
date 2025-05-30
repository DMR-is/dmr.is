import { AdvertModel } from '../advert.model'
import { AdvertDto } from './advert.dto'

export const advertMigrate = (model: AdvertModel): AdvertDto => ({
  id: model.id,
  caseId: model.caseId,
  publicationNumber: model.publicationNumber,
  scheduledAt: model.scheduledAt.toISOString(),
  publishedAt: model.publishedAt ? model.publishedAt.toISOString() : null,
  version: model.version,
  html: model.html,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})
