import { MainCategory } from '@dmr.is/shared/dto'

import { AdvertMainCategory } from '../models/AdvertMainCategory'

export function advertMainCategoryMigrate(
  model: AdvertMainCategory,
): MainCategory {
  const result: MainCategory = {
    description: model.description,
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
