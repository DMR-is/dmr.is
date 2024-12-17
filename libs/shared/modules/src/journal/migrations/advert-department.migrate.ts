import { Department } from '@dmr.is/shared/dto'

import { AdvertDepartmentModel } from '../models/advert-department.model'

export function advertDepartmentMigrate(
  model: AdvertDepartmentModel,
): Department {
  const result: Department = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
