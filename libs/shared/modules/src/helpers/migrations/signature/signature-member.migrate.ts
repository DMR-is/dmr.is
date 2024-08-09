import { SignatureMember } from '@dmr.is/shared/dto'

import { SignatureMemberModel } from '../../../signature/models'

export const signatureMemberMigrate = (
  model: SignatureMemberModel,
): SignatureMember => {
  return {
    text: model.text,
    textAbove: model.textAbove,
    textAfter: model.textAfter,
    textBelow: model.textBelow,
  }
}
