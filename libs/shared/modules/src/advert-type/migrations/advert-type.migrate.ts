import { AdvertType } from '../dto'
import { AdvertTypeModelNew } from '../models'

export const advertTypeMigrate = (model: AdvertTypeModelNew): AdvertType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
