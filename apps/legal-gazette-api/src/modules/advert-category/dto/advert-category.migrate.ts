import { AdvertCategoryModel } from '../advert-category.model'
import { AdvertCategoryDto } from './advert-category.dto'

export const advertCategoryMigrate = (
  model: AdvertCategoryModel,
): AdvertCategoryDto => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
})
