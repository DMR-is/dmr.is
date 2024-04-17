import { Institution } from '@dmr.is/shared/dto'

import { AdvertInvolvedParty } from '../models/AdvertInvolvedParty'

export function advertInvolvedPartyMigrate(
  model: AdvertInvolvedParty,
): Institution {
  const result: Institution = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
