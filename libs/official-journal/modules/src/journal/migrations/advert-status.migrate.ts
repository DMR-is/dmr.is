import { AdvertStatus } from '@dmr.is/shared-dto'
import { safeEnumMapper } from '@dmr.is/utils-server/serverUtils'

import { AdvertStatusModel } from '../models/advert-status.model'

export function advertStatusMigrate(model: AdvertStatusModel): AdvertStatus {
  const result = safeEnumMapper(model.title, AdvertStatus)

  return result ? result : AdvertStatus.Draft
}
