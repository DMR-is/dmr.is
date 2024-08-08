import { SignatureType } from '@dmr.is/shared/dto'

import { SignatureTypeModel } from '../../../signature/models'

export const signatureTypeMigrate = (
  model: SignatureTypeModel,
): SignatureType => {
  return {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }
}
