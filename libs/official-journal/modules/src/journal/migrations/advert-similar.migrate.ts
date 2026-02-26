import { AdvertSimilar } from '@dmr.is/shared-dto'

import { AdvertModel } from '../models'
import { advertCategoryMigrate } from './advert-category.migrate'
import { advertDepartmentMigrate } from './advert-department.migrate'
import { advertInvolvedPartyMigrate } from './advert-involvedparty.migrate'

export function advertSimilarMigrate(model: AdvertModel): AdvertSimilar {
  const advert: AdvertSimilar = {
    id: model.id,
    title: `${model.type.title} ${model.subject}`,
    department: model.department
      ? advertDepartmentMigrate(model.department)
      : null,
    subject: model.subject,
    publicationNumber: {
      full: `${model.serialNumber}/${model.publicationYear}`,
      number: model.serialNumber,
      year: model.publicationYear,
    },
    publicationDate: model.publicationDate.toISOString(),
    categories: model.categories
      ? model.categories.map((item) => advertCategoryMigrate(item))
      : [],
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
  }
  return advert
}
