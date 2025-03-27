import { advertDepartmentMigrate } from '@dmr.is/official-journal/modules/journal'
import { AdvertType } from '../dto/advert-type.dto'
import { AdvertTypeModel } from '../models/advert-type.model'

export const advertTypeMigrate = (model: AdvertTypeModel): AdvertType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: advertDepartmentMigrate(model.department),
  }
}
