import { ApplicationFeeCode } from '@dmr.is/shared/dto'

import { AdvertFeeCodesModel } from '../models'

export function applicationFeeCodeMigrate(
  model: AdvertFeeCodesModel,
): ApplicationFeeCode {
  const result: ApplicationFeeCode = {
    id: model.id,
    feeCode: model.feeCode,
    description: model.description,
    feeType: model.feeType,
    value: model.value,
  }
  return result
}
