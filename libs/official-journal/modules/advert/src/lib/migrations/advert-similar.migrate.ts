import { institutionMigrate } from '@dmr.is/official-journal/migrations/institution/institution.migrate'
import { AdvertModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { AdvertSimilar } from '../dto/advert-similar.dto'

export function advertSimilarMigrate(model: AdvertModel): AdvertSimilar {
  const advert: AdvertSimilar = {
    id: model.id,
    title: `${model.type.title} ${model.subject}`,
    department: baseEntityMigrate(model.department),
    subject: model.subject,
    publicationNumber: {
      full: `${model.serialNumber}/${model.publicationYear}`,
      number: model.serialNumber,
      year: model.publicationYear,
    },
    publicationDate: model.publicationDate.toISOString(),
    categories: model.categories
      ? model.categories.map((item) => baseEntityMigrate(item))
      : [],
    involvedParty: institutionMigrate(model.involvedParty),
  }
  return advert
}
