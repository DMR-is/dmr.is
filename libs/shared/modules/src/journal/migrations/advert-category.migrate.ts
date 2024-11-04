import { Category } from '@dmr.is/shared/dto'

import { AdvertCategoryModel } from '../models/advert-category.model'

export function advertCategoryMigrate(model: AdvertCategoryModel): Category {
  const result: Category = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainCategory: model.mainCategory
      ? {
          id: model.mainCategory.id,
          slug: model.mainCategory.slug,
          title: model.mainCategory.title,
          description: model.mainCategory.description,
        }
      : null,
  }
  return result
}
