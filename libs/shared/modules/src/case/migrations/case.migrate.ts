import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { Case } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { attachmentMigrate } from '../../attachments/migrations/attachment.migration'
import { caseCommentMigrate } from '../../comment/migrations/case-comment.migrate'
import { advertCategoryMigrate } from '../../journal/migrations/advert-category.migrate'
import { advertInvolvedPartyMigrate } from '../../journal/migrations/advert-involvedparty.migrate'
import { signatureMigrate } from '../../signature/migrations/signature.migrate'
import { CaseModel } from '../models'
import { caseChannelMigrate } from './case-channel.migrate'
import { caseCommunicationStatusMigrate } from './case-communication-status.migrate'
import { caseStatusMigrate } from './case-status.migrate'
import { caseTagMigrate } from './case-tag.migrate'

export const caseMigrate = (model: CaseModel): Case => {
  return withTryCatch(() => {
    return {
      id: model.id,
      applicationId: model.applicationId,
      year: model.year,
      caseNumber: model.caseNumber,
      status: caseStatusMigrate(model.status),
      tag: model.tag ? caseTagMigrate(model.tag) : null,
      involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
      createdAt: model.createdAt,
      assignedTo:
        ALL_MOCK_USERS.find((u) => u.id === model.assignedUserId) ?? null, // TODO: Implement this when auth is ready
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
      advertDepartment: model.department,
      advertType: model.advertType,
      advertCategories: model.categories.map((c) => advertCategoryMigrate(c)),
      message: model.message,
      html: model.html,
      channels: model.channels.map((c) => caseChannelMigrate(c)),
      signatures: model.signatures.map((s) => signatureMigrate(s)),
      comments: model.comments.map((c) => caseCommentMigrate(c)),
      attachments: model.attachments.map((a) => attachmentMigrate(a)),
    }
  }, `Error migrating case ${model.id}`)
}
