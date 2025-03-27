import { InstitutionDto } from '../dto/institution.dto'
import { InstitutionModel } from '@dmr.is/official-journal/models'

export function institutionMigrate(model: InstitutionModel): InstitutionDto {
  const result: InstitutionDto = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    nationalId: model.nationalId,
  }
  return result
}
