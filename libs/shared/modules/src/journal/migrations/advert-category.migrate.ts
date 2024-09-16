import { Category } from '@dmr.is/shared/dto'

import { AdvertCategoryModel } from '../models/advert-category.model'
import { advertMainCategoryMigrate } from './advert-main-category.migrate'

export function advertCategoryMigrate(model: AdvertCategoryModel): Category {
  const result: Category = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainCategory: model.mainCategory
      ? advertMainCategoryMigrate(model.mainCategory)
      : null,
  }
  return result
}
