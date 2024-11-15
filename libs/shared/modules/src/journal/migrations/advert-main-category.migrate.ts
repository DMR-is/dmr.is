import { MainCategory } from '@dmr.is/shared/dto'

import { AdvertMainCategoryModel } from '../models'
import { advertCategoryMigrate } from './advert-category.migrate'

export function advertMainCategoryMigrate(
  model: AdvertMainCategoryModel,
): MainCategory {
  const result: MainCategory = {
    description: model.description,
    id: model.id,
    slug: model.slug,
    title: model.title,
    categories: model.categories?.map(advertCategoryMigrate) ?? [],
  }
  return result
}
