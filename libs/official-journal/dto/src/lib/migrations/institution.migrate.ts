import { InstitutionDto } from '../dto/institution.dto'
import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'

export const institutionMigrate = (
  model: AdvertInvolvedPartyModel,
): InstitutionDto => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
  nationalId: model.nationalId,
})
