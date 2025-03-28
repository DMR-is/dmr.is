import { CaseModel } from '@dmr.is/official-journal/models'
import { CaseDetailed } from '../dto/case.dto'
import { caseAdditionMigrate } from './case-addition.migrate'
import { caseChannelMigrate } from './case-channel.migrate'
import { caseCommunicationStatusMigrate } from './case-communication-status.migrate'
import { caseHistoryMigrate } from './case-history.migrate'
import { caseStatusMigrate } from './case-status.migrate'
import { caseTagMigrate } from './case-tag.migrate'
import { caseTransactionMigrate } from './case-transaction.migrate'

import {
  advertInvolvedPartyMigrate,
  advertDepartmentMigrate,
  advertCategoryMigrate,
  advertCorrectionMigrate,
} from '@dmr.is/official-journal/modules/journal'
import { userMigrate } from '@dmr.is/official-journal/modules/user'
import { signatureMigrate } from '@dmr.is/official-journal/modules/signature'
import { commentMigrate } from '@dmr.is/official-journal/modules/comment'
import { attachmentMigrate } from '@dmr.is/official-journal/modules/attachment'

export const caseDetailedMigrate = (model: CaseModel): CaseDetailed => {
  return {
    id: model.id,
    advertId: model.advertId,
    applicationId: model?.applicationId,
    year: model.year,
    caseNumber: model.caseNumber,
    status: caseStatusMigrate(model.status),
    tag: model.tag ? caseTagMigrate(model.tag) : null,
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    createdAt: model.createdAt,
    assignedTo: model.assignedUser ? userMigrate(model.assignedUser) : null,
    communicationStatus: caseCommunicationStatusMigrate(
      model.communicationStatus,
    ),
    fastTrack: model.fastTrack,
    isLegacy: model.isLegacy,
    modifiedAt: model.updatedAt,
    publishedAt: model.publishedAt,
    requestedPublicationDate: model.requestedPublicationDate,
    advertTitle: model.advertTitle,
    advertDepartment: advertDepartmentMigrate(model.department),
    advertType: model.advertType,
    transaction: model.transaction
      ? caseTransactionMigrate(model.transaction)
      : undefined,
    message: model.message,
    html: model.html,
    publicationNumber: model.publicationNumber,
    advertCategories: model.categories
      ? (model.categories.map((c) => advertCategoryMigrate(c)) ?? [])
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
      : undefined,
    history: model.history.map((h) => caseHistoryMigrate(h)),
  }
}
