import { AdvertTypeModel } from '../advert-type.model'
import { AdvertTypeDetailedDto, AdvertTypeDto } from './advert-type.dto'

export const advertTypeMigrate = (model: AdvertTypeModel): AdvertTypeDto => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}

export const advertTypeDetailedMigrate = (
  model: AdvertTypeModel,
): AdvertTypeDetailedDto => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
    deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
  }
}
