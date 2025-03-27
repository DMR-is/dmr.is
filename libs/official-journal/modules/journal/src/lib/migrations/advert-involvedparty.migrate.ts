import { Institution } from '@dmr.is/shared/dto'

import { AdvertInvolvedPartyModel } from '../models/advert-involved-party.model'

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
