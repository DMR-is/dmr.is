import { MainCategory } from '@dmr.is/shared/dto'

import { AdvertMainCategoryModel } from '../models'

export function advertMainCategoryMigrate(
  model: AdvertMainCategoryModel,
): MainCategory {
  const result: MainCategory = {
    description: model.description,
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
