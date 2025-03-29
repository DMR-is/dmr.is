import { AdvertModel } from '@dmr.is/official-journal/models'
import { AdvertSimilar } from '../dto/advert-similar.dto'
import { advertCategoryMigrate } from '../../../../../../libs/official-journal/modules/category/src/lib/migrations/advert-category.migrate'
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
