import { TransactionFeeCode } from '@dmr.is/shared/dto'

import { TransactionFeeCodesModel } from '../models'

export function transactionFeeCodeMigrate(
  model: TransactionFeeCodesModel,
): TransactionFeeCode {
  const result: TransactionFeeCode = {
    id: model.id,
    feeCode: model.feeCode,
    description: model.description,
    feeType: model.feeType,
    value: model.value,
    department: model.department,
  }
  return result
}
