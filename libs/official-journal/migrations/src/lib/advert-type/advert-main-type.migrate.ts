import { AdvertMainType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'
import { AdvertMainTypeModel } from '@dmr.is/official-journal/models'

import { advertTypeMigrate } from './advert-type.migrate'

export const advertMainTypeMigrate = (
  model: AdvertMainTypeModel,
): AdvertMainType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: model.department,
    types: model.types?.map((type) => advertTypeMigrate(type)) ?? [],
  }
}
