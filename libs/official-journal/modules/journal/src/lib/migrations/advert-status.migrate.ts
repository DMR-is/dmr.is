import { AdvertStatusModel } from '@dmr.is/official-journal/models'
import { safeEnumMapper } from '@dmr.is/utils'
import { AdvertStatus } from '../dto/advert-constants.dto'

export function advertStatusMigrate(model: AdvertStatusModel): AdvertStatus {
  const result = safeEnumMapper(model.title, AdvertStatus)

  return result ? result : AdvertStatus.Draft
}
