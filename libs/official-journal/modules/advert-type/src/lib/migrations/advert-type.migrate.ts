import { baseEntityMigrate } from '@dmr.is/shared/dto'
import { AdvertType } from '../dto/advert-type.dto'
import { AdvertTypeModel } from '@dmr.is/official-journal/models'

export const advertTypeMigrate = (model: AdvertTypeModel): AdvertType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: baseEntityMigrate(model.department),
  }
}
