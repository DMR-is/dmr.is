import { AdvertType } from '@dmr.is/official-journal/dto/advert-type/advert-type.dto'
import { AdvertTypeModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

export const advertTypeMigrate = (model: AdvertTypeModel): AdvertType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
    department: baseEntityMigrate(model.department),
  }
}
