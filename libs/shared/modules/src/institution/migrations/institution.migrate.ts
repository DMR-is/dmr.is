import { InstitutionDto } from '@dmr.is/shared/dto'

import { InstitutionModel } from '../models/institution.model'

export function institutionMigrate(model: InstitutionModel): InstitutionDto {
  const result: InstitutionDto = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
