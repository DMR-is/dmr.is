import { Department } from '@dmr.is/shared/dto'

import { AdvertDepartmentDTO } from '../models/AdvertDepartment'

export function advertDepartmentMigrate(
  model: AdvertDepartmentDTO,
): Department {
  const result: Department = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
