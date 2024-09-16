import { AdvertType } from '@dmr.is/shared/dto'

import { AdvertTypeModel } from '../models'

export function advertTypesMigrate(model: AdvertTypeModel): AdvertType {
  const result: AdvertType = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    department: model.department
      ? {
          id: model.department.id,
          slug: model.department.slug,
          title: model.department.title,
        }
      : null,
  }

  return result
}
