import { CaseTransactionModel } from '@dmr.is/official-journal/models'
import { TBRTransaction } from '@dmr.is/official-journal/modules/price'

export const caseTransactionMigrate = (
  model: CaseTransactionModel,
): TBRTransaction => ({
  id: model.id,
  externalReference: model.externalReference,
  price: model.price,
  feeCodes: model.feeCodes,
  customBaseCount: model.customBaseCount,
  customAdditionalDocCount: model.customAdditionalDocCount,
  customAdditionalCharacterCount: model.customAdditionalCharacterCount,
  extraWorkCount: model.extraWorkCount,
  subject: model.subject,
  imageTier: model.imageTier,
})
