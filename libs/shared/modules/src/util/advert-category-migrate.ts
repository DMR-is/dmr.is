import { Category } from '@dmr.is/shared/dto'

import { AdvertCategoryDTO } from '../models/AdvertCategory'
import { advertMainCategoryMigrate } from './advert-main-category-migrate'

export function advertCategoryMigrate(model: AdvertCategoryDTO): Category {
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
