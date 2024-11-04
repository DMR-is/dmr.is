import { Category } from '@dmr.is/shared/dto'

import { AdvertCategoryModel } from '../models/advert-category.model'

export function advertCategoryMigrate(model: AdvertCategoryModel): Category {
  const result: Category = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainCategories: [],
  }
  return result
}
