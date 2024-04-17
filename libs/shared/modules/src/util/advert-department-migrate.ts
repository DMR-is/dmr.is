import { Department } from '@dmr.is/shared/dto'

import { AdvertDepartment } from '../models/AdvertDepartment'

export function advertDepartmentMigrate(model: AdvertDepartment): Department {
  const result: Department = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
