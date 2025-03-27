import { SignatureRecordModel } from '@dmr.is/official-journal/models'
import { SignatureRecord } from '../dto/signature-record.dto'
import { signatureMemberMigrate } from './signature-member.migrate'

export const signatureRecordMigrate = (
  model: SignatureRecordModel,
): SignatureRecord => {
  return {
    id: model.id,
    institution: model.institution,
    signatureDate: model.signatureDate,
    additional: model.additional ?? null,
    chairman: model.chairman ? signatureMemberMigrate(model.chairman) : null,
    members: model.members.map((m) => signatureMemberMigrate(m)),
  }
}
