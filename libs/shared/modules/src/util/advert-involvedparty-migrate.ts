import { Institution } from '@dmr.is/shared/dto'

import { AdvertInvolvedPartyDTO } from '../models/AdvertInvolvedParty'

export function advertInvolvedPartyMigrate(
  model: AdvertInvolvedPartyDTO,
): Institution {
  const result: Institution = {
    id: model.id,
    slug: model.slug,
    title: model.title,
  }
  return result
}
