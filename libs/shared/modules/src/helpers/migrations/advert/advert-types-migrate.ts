import { AdvertType } from '@dmr.is/shared/dto'

import { AdvertTypeDTO } from '../../../journal/models'

export function advertTypesMigrate(model: AdvertTypeDTO): AdvertType {
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