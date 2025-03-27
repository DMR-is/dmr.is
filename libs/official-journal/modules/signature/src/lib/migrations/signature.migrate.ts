import { advertInvolvedPartyMigrate } from '@dmr.is/official-journal/modules/journal'
import { SignatureModel } from '../models/signature.model'
import { signatureRecordMigrate } from './signature-record.migrate'
import { Signature } from '../dto/signature.dto'

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
