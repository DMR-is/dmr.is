import { CaseTransaction } from '@dmr.is/shared/dto'

import { CaseTransactionModel } from '../models'

export const caseTransactionMigrate = (
  model: CaseTransactionModel,
): CaseTransaction => {
  try {
    const mapped = {
      id: model.id,
      externalReference: model.externalReference,
      price: model.price,
      feeCodes: model.feeCodes,
      customBaseCount: model.customBaseCount,
      customDocCount: model.customDocCount,
      paid: model.paid,
      imageTier: model.imageTier,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case transaction: ${e}`)
  }
}
