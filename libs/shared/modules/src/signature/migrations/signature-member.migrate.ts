import { SignatureMember } from '@dmr.is/shared/dto'

import { SignatureMemberModel } from '../models'

export const signatureMemberMigrate = (
  model: SignatureMemberModel,
): SignatureMember => {
  return {
    id: model.id,
    text: model.text,
    textBefore: model.textBefore,
    textAbove: model.textAbove,
    textAfter: model.textAfter,
    textBelow: model.textBelow,
  }
}
