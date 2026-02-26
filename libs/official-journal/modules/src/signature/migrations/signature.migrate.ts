import { Signature } from '@dmr.is/shared-dto'

import { advertInvolvedPartyMigrate } from '../../journal/migrations'
import { SignatureModel } from '../models/signature.model'
import { signatureRecordMigrate } from './signature-record.migrate'

export const signatureMigrate = (model: SignatureModel): Signature => {
  return {
    id: model.id,
    signatureDate: new Date(model.signatureDate).toISOString(),
    created: model.created.toISOString(),
    html: model.html,
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    records: model.records.map((r) => signatureRecordMigrate(r)),
  }
}
