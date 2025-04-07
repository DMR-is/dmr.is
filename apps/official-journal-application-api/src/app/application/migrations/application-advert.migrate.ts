import { AdvertModel } from '@dmr.is/official-journal/models'

import { ApplicationAdvertItem } from '../dto/get-application-advert.dto'

export const applicationAdvertMigrate = (
  model: AdvertModel,
): ApplicationAdvertItem => {
  return {
    id: model.id,
    title: model.subject,
    department: {
      id: model.department.id,
      title: model.department.title,
      slug: model.department.slug,
    },
    type: {
      id: model.type.id,
      title: model.type.title,
      slug: model.type.slug,
    },
    mainType: model.type.mainType
      ? {
          id: model.type.mainType.id,
          title: model.type.mainType.title,
          slug: model.type.mainType.slug,
        }
      : null,
    categories: model.categories
      ? model.categories.map((category) => ({
          id: category.id,
          title: category.title,
          slug: category.slug,
        }))
      : [],
    html: model.documentHtml,
  }
}
