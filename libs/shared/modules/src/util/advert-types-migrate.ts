import { AdvertType as AdvertTypeDTO } from '@dmr.is/shared/dto'

import { AdvertType } from '../models/AdvertType'

export function advertTypesMigrate(model: AdvertType): AdvertTypeDTO {
  const result: AdvertTypeDTO = {
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
