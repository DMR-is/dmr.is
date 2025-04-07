import { AdvertCategoryModel } from '@dmr.is/official-journal/models'

import { Category } from '../dto/category.dto'

export function advertCategoryMigrate(model: AdvertCategoryModel): Category {
  const result: Category = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainCategories: model.mainCategories?.map((mainCategory) => ({
      id: mainCategory.id,
      title: mainCategory.title,
      slug: mainCategory.slug,
      description: mainCategory.description,
    })),
  }
  return result
}
