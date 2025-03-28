import {
  AdvertStatusEnum,
  AdvertStatusModel,
} from '@dmr.is/official-journal/models'
import { safeEnumMapper } from '@dmr.is/utils'

export function advertStatusMigrate(
  model: AdvertStatusModel,
): AdvertStatusEnum {
  const result = safeEnumMapper(model.title, AdvertStatusEnum)

  return result ? result : AdvertStatusEnum.Draft
}
