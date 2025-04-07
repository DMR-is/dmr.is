import { Signature } from '@dmr.is/official-journal/dto/signature/signature.dto'
import { SignatureModel } from '@dmr.is/official-journal/models'

import { institutionMigrate } from '../institution/institution.migrate'
import { signatureRecordMigrate } from './signature.record.migrate'

export const signatureMigrate = (model: SignatureModel): Signature => {
  return {
    id: model.id,
    signatureDate: new Date(model.signatureDate).toISOString(),
    created: model.created.toISOString(),
    html: model.html,
    involvedParty: institutionMigrate(model.involvedParty),
    records: model.records.map((r) => signatureRecordMigrate(r)),
  }
}
