import { AdvertMainType } from '@dmr.is/shared/dto'

import { AdvertMainTypeModel } from '../models/advert-main-type.model'
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
