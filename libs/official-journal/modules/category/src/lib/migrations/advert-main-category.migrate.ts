import { AdvertMainCategoryModel } from '@dmr.is/official-journal/models'

import { MainCategory } from '../dto/main-category.dto'
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
    departmentId: model.departmentId,
  }
  return result
}
