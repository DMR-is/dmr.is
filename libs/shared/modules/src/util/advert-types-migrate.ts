import { AdvertType } from '@dmr.is/shared/dto'

import { AdvertTypeDTO } from '../models'

export function advertTypesMigrate(model: AdvertTypeDTO): AdvertType {
  const result: AdvertType = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    department: {
      id: model.department.id,
      slug: model.department.slug,
      title: model.department.title,
    },
  }
  return result
}
