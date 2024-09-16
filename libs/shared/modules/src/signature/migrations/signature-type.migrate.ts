import { SignatureType } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { SignatureTypeModel } from '../models'

export const signatureTypeMigrate = (
  model: SignatureTypeModel,
): SignatureType => {
  return withTryCatch<SignatureType>(() => {
    return {
      id: model.id,
      title: model.title,
      slug: model.slug,
    }
  }, 'Error migrating signature type')
}
