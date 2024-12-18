import { AdvertModel } from './advert.model'
import { AdvertAttachmentsModel } from './advert-attachments.model'
import { AdvertCategoriesModel } from './advert-categories.model'
import { AdvertCategoryModel } from './advert-category.model'
import { AdvertCategoryCategoriesModel } from './advert-category-categories.model'
import { AdvertCategoryDepartmentsModel } from './advert-category-departments.model'
import { AdvertDepartmentModel } from './advert-department.model'
import { AdvertInvolvedPartyModel } from './advert-involved-party.model'
import { AdvertMainCategoryModel } from './advert-main-category.model'
import { AdvertStatusModel } from './advert-status.model'

export {
  AdvertModel,
  AdvertAttachmentsModel,
  AdvertCategoriesModel,
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertMainCategoryModel,
  AdvertStatusModel,
  AdvertCategoryDepartmentsModel,
  AdvertCategoryCategoriesModel,
}

export const models = [
  AdvertModel,
  AdvertCategoriesModel,
  AdvertAttachmentsModel,
  AdvertCategoryModel,
  AdvertInvolvedPartyModel,
  AdvertMainCategoryModel,
  AdvertStatusModel,
  AdvertCategoryDepartmentsModel,
  AdvertDepartmentModel,
  AdvertCategoryCategoriesModel,
]

export default models
