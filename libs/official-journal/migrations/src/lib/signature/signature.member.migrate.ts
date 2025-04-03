import { SignatureMember } from '@dmr.is/official-journal/dto/signature/signature.dto'
import { SignatureMemberModel } from '@dmr.is/official-journal/models'

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
