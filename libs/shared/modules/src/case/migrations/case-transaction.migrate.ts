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
      customAdditionalDocCount: model.customAdditionalDocCount,
      customAdditionalCharacterCount: model.customAdditionalCharacterCount,
      imageTier: model.imageTier,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case transaction: ${e}`)
  }
}
