import { advertDepartmentMigrate } from '../../journal/migrations'
import { AdvertType } from '../dto/advert-type.dto'
import { AdvertTypeModel } from '../models'

export const advertTypeMigrate = (model: AdvertTypeModel): AdvertType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: advertDepartmentMigrate(model.department),
  }
}
