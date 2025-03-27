import { AdvertCategoryCategoriesModel } from '@dmr.is/official-journal/models'
import { MainCategory } from '../dto/main-category.dto'

export const categoryCategoriesMigrate = (
  models: AdvertCategoryCategoriesModel[],
): MainCategory[] => {
  const mainCategories: MainCategory[] = []

  models.forEach((model) => {
    const found = mainCategories.find(
      (mainCategory) => mainCategory.id === model.mainCategoryId,
    )

    if (found) {
      found.categories.push({
        id: model.category.id,
        slug: model.category.slug,
        title: model.category.title,
      })
    } else {
      mainCategories.push({
        id: model.mainCategory.id,
        slug: model.mainCategory.slug,
        title: model.mainCategory.title,
        description: model.mainCategory.description,
        categories: [
          {
            id: model.category.id,
            slug: model.category.slug,
            title: model.category.title,
          },
        ],
        departmentId: model.mainCategory.departmentId,
      })
    }
  })

  return mainCategories
}
