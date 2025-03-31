import { CaseTransactionModel } from '@dmr.is/official-journal/models'
import { TBRTransaction } from '@dmr.is/official-journal/modules/price'

export const caseTransactionMigrate = (
  model: CaseTransactionModel,
): TBRTransaction => {
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
