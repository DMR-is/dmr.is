import { logger } from '@dmr.is/logging'
import { Signature } from '@dmr.is/shared/dto'

import { advertInvolvedPartyMigrate } from '../../journal/migrations'
import { SignatureModel } from '../models'
import { signatureMemberMigrate } from './signature-member.migrate'
import { signatureTypeMigrate } from './signature-type.migrate'

export const signatureMigrate = (model: SignatureModel): Signature => {
  try {
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
  } catch (error) {
    logger.error('Error migrating signature', error)
    throw error
  }
}
