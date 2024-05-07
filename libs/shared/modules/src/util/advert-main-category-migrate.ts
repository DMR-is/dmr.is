import { MainCategory } from '@dmr.is/shared/dto'

import { AdvertMainCategoryDTO } from '../journal/models'

export function advertMainCategoryMigrate(
  model: AdvertMainCategoryDTO,
): MainCategory {
  const result: MainCategory = {
    description: model.description,
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
