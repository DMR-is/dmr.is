import { AdvertMainType } from '@dmr.is/shared/dto'

import { AdvertMainTypeModel } from '../models/advert-main-type.model'

export const advertMainTypeMigrate = (
  model: AdvertMainTypeModel,
): AdvertMainType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: {
      id: model.department.id,
      title: model.department.title,
      slug: model.department.slug,
    },
    types:
      model.types?.map((type) => ({
        id: type.id,
        title: type.title,
        slug: type.slug,
      })) ?? [],
  }
}
