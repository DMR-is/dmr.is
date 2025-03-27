import { AdvertDepartmentModel } from '@dmr.is/official-journal/models'
import { Department } from '../dto/department.dto'

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
