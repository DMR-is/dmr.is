import { Department } from '@dmr.is/shared/dto'

import { advertMainTypeMigrate } from '../../advert-type/migrations'
import { AdvertDepartmentModel } from '../models/advert-department.model'

export function advertDepartmentMigrate(
  model: AdvertDepartmentModel,
): Department {
  const result: Department = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    mainTypes: model.mainTypes
      ? model.mainTypes.map((t) => advertMainTypeMigrate(t))
      : [],
  }
  return result
}
