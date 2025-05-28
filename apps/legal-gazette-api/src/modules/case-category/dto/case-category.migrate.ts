import { CaseCategoryModel } from '../case-category.model'
import { CaseCategoryDto } from './case-category.dto'

export const caseCategoryMigrate = (
  model: CaseCategoryModel,
): CaseCategoryDto => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
})
