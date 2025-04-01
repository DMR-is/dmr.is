import { InstitutionDto } from '@dmr.is/official-journal/dto/institution/institution.dto'
import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'

export function institutionMigrate(
  model: AdvertInvolvedPartyModel,
): InstitutionDto {
  const result: InstitutionDto = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    nationalId: model.nationalId,
  }
  return result
}
