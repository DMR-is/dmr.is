import { TransactionFeeCodesModel } from '@dmr.is/official-journal/models'

import { TransactionFeeCode } from '@dmr.is/official-journal/modules/application'

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
