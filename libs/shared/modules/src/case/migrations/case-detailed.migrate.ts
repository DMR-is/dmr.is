import { CaseDetailed } from '@dmr.is/shared/dto'

import { adminUserMigrate } from '../../admin-user/migrations/admin-user.migrate'
import { attachmentMigrate } from '../../attachments/migrations/attachment.migration'
import { commentMigrate } from '../../comment/v2'
import { advertDepartmentMigrate } from '../../journal/migrations'
import { advertCategoryMigrate } from '../../journal/migrations/advert-category.migrate'
import { advertInvolvedPartyMigrate } from '../../journal/migrations/advert-involvedparty.migrate'
import { signatureMigrate } from '../../signature/migrations/signature.migrate'
import { CaseModel } from '../models'
import { caseAdditionMigrate } from './case-addition.migrate'
import { caseChannelMigrate } from './case-channel.migrate'
import { caseCommunicationStatusMigrate } from './case-communication-status.migrate'
import { caseStatusMigrate } from './case-status.migrate'
import { caseTagMigrate } from './case-tag.migrate'

export const caseDetailedMigrate = (model: CaseModel): CaseDetailed => {
  return {
    id: model.id,
    applicationId: model?.applicationId,
    year: model.year,
    caseNumber: model.caseNumber,
    status: caseStatusMigrate(model.status),
    tag: model.tag ? caseTagMigrate(model.tag) : null,
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    createdAt: model.createdAt,
    assignedTo: model.assignedUser
      ? adminUserMigrate(model.assignedUser)
      : null,
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
    signatures: model.signatures
      ? model.signatures.map((s) => signatureMigrate(s))
      : [],
    comments: model.comments
      ? model.comments.map((c) => commentMigrate(c))
      : [],
    attachments: model.attachments
      ? model.attachments.map((a) => attachmentMigrate(a))
      : [],
    additions: model.additions
      ? model.additions.map((add) => caseAdditionMigrate(add))
      : [],
  }
}
