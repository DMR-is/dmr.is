import { Category } from '@dmr.is/shared/dto'

import { AdvertCategory } from '../models/AdvertCategory'
import { advertMainCategoryMigrate } from './advert-main-category-migrate'

export function advertCategoryMigrate(model: AdvertCategory): Category {
  const result: Category = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainCategory: advertMainCategoryMigrate(model.mainCategory),
  }
  return result
}
