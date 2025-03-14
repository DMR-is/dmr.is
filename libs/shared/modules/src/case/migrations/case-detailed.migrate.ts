import { CaseDetailed } from '@dmr.is/shared/dto'

import { attachmentMigrate } from '../../attachments/migrations/attachment.migration'
import { commentMigrate } from '../../comment/v2/migrations/comment.migrate'
import { advertDepartmentMigrate } from '../../journal/migrations'
import { advertCategoryMigrate } from '../../journal/migrations/advert-category.migrate'
import { advertCorrectionMigrate } from '../../journal/migrations/advert-correction.migrate'
import { advertInvolvedPartyMigrate } from '../../journal/migrations/advert-involvedparty.migrate'
import { signatureMigrate } from '../../signature/migrations/signature.migrate'
import { userMigrate } from '../../user/migration/user.migrate'
import { CaseModel } from '../models'
import { caseAdditionMigrate } from './case-addition.migrate'
import { caseChannelMigrate } from './case-channel.migrate'
import { caseCommunicationStatusMigrate } from './case-communication-status.migrate'
import { caseHistoryMigrate } from './case-history.migrate'
import { caseStatusMigrate } from './case-status.migrate'
import { caseTagMigrate } from './case-tag.migrate'

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
    paid: model.paid ?? false,
    price: model.price,
    publishedAt: model.publishedAt,
    requestedPublicationDate: model.requestedPublicationDate,
    advertTitle: model.advertTitle,
    advertDepartment: advertDepartmentMigrate(model.department),
    advertType: model.advertType,
    message: model.message,
    html: model.html,
    publicationNumber: model.publicationNumber,
    advertCategories: model.categories
      ? model.categories.map((c) => advertCategoryMigrate(c)) ?? []
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
