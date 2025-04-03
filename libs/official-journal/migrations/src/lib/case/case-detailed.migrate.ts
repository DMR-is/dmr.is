import { CaseModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { CaseDetailed } from '@dmr.is/official-journal/dto/case/case.dto'
import { caseAdditionMigrate } from '../case-addition/case-addition.migrate'
import { caseStatusMigrate } from '../case-status/case-status.migrate'
import { caseTagMigrate } from '../case-tag/case-tag.migrate'
import { userMigrate } from '../user/user.migrate'
import { caseChannelMigrate } from '../case-channel/case-channel.migrate'
import { communicationStatusMigrate } from '../communication-status/communication-status.migrate'
import { caseHistoryMigrate } from '../case-history/case-history.migrate'
import { caseTransactionMigrate } from '../case-transaction/transaction.migrate'
import { signatureMigrate } from '../signature/signature.migrate'
import { commentMigrate } from '../comment/comment.migrate'
import { attachmentMigrate } from '../attachment/attachment.migrate'
import { advertTypeMigrate } from '../advert-type/advert-type.migrate'
import { advertCorrectionMigrate } from '../advert-correction/advert-correction.migrate'

export const caseDetailedMigrate = (model: CaseModel): CaseDetailed => {
  return {
    id: model.id,
    advertId: model.advertId,
    applicationId: model?.applicationId,
    year: model.year,
    caseNumber: model.caseNumber,
    status: caseStatusMigrate(model.status),
    tag: model.tag ? caseTagMigrate(model.tag) : null,
    involvedParty: {
      id: model.involvedParty.id,
      title: model.involvedParty.title,
      slug: model.involvedParty.slug,
      nationalId: model.involvedParty.nationalId,
    },
    createdAt: model.createdAt,
    assignedTo: model.assignedUser ? userMigrate(model.assignedUser) : null,
    communicationStatus: communicationStatusMigrate(model.communicationStatus),
    fastTrack: model.fastTrack,
    isLegacy: model.isLegacy,
    modifiedAt: model.updatedAt,
    publishedAt: model.publishedAt,
    requestedPublicationDate: model.requestedPublicationDate,
    advertTitle: model.advertTitle,
    advertDepartment: baseEntityMigrate(model.department),
    advertType: advertTypeMigrate(model.advertType),
    transaction: model.transaction
      ? caseTransactionMigrate(model.transaction)
      : undefined,
    message: model.message,
    html: model.html,
    publicationNumber: model.publicationNumber,
    advertCategories: model.categories
      ? (model.categories.map((c) => baseEntityMigrate(c)) ?? [])
      : [],
    channels: model.channels
      ? model.channels.map((c) => caseChannelMigrate(c))
      : [],
    signature: signatureMigrate(model.signature),
    comments: model.comments
      ? model.comments.map((c) => commentMigrate(c))
      : [],
    attachments: model.attachments
      ? model.attachments.map((a) => attachmentMigrate(a))
      : [],
    additions: model.additions
      ? model.additions.map((add) => caseAdditionMigrate(add))
      : [],
    advertCorrections: model.advert?.corrections
      ? model.advert.corrections.map((item) => advertCorrectionMigrate(item))
      : [],
    history: model.history.map((h) => caseHistoryMigrate(h)),
  }
}
