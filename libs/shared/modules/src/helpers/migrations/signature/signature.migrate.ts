import { Signature } from '@dmr.is/shared/dto'

import { SignatureModel } from '../../../signature/models'
import { advertInvolvedPartyMigrate } from '../advert'
import { signatureMemberMigrate } from './signature-member.migrate'
import { signatureTypeMigrate } from './signature-type.migrate'

export const signatureMigrate = (model: SignatureModel): Signature => {
  return {
    id: model.id,
    type: signatureTypeMigrate(model.type),
    institution: model.institution,
    date: model.date,
    members: model.members.map((m) => signatureMemberMigrate(m)),
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    chairman: model.chairman ? signatureMemberMigrate(model.chairman) : null,
    additionalSignature: model.additionalSignature ?? null,
    html: model.html ?? null,
  }
}
