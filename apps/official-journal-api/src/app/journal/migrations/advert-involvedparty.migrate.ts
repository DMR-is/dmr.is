import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'
import { Institution } from '@dmr.is/official-journal/modules/institution'

export function advertInvolvedPartyMigrate(
  model: AdvertInvolvedPartyModel,
): Institution {
  const result: Institution = {
    id: model.id,
    slug: model.slug,
    title: model.title,
    nationalId: model.nationalId,
  }
  return result
}
