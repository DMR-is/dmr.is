import { SignatureMemberModel } from '@dmr.is/official-journal/models'
import { SignatureMember } from '../dto/signature-member.dto'

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
