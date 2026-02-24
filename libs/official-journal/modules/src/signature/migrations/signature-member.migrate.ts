import { SignatureMember } from '@dmr.is/shared-dto'

import { SignatureMemberModel } from '../models/signature-member.model'

export const signatureMemberMigrate = (
  model: SignatureMemberModel,
): SignatureMember => {
  return {
    id: model.id,
    name: model.name,
    textBefore: model.textBefore,
    textAbove: model.textAbove,
    textAfter: model.textAfter,
    textBelow: model.textBelow,
  }
}
