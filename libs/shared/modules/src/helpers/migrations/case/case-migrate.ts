import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { Case } from '@dmr.is/shared/dto'

import { CaseDto } from '../../../case/models'
import { caseStatusMapper } from '../../mappers'
import { advertInvolvedPartyMigrate } from '../advert'
import { advertCategoryMigrate } from '../advert/advert-category-migrate'
import { caseChannelMigrate } from './case-channel-migrate'
import { caseCommentMigrate } from './case-comment-migrate'
import { caseCommunicationStatusMigrate } from './case-communication-status-migrate'
import { caseTagMigrate } from './case-tag-migrate'

export const caseMigrate = (model: CaseDto): Case => {
  const status = caseStatusMapper(model.status.value)

  if (!status) {
    throw new Error(`Unknown case status: ${model.status.value}`)
  }

  return {
    id: model.id,
    applicationId: model.applicationId,
    year: model.year,
    caseNumber: model.caseNumber,
    status: status,
    tag: model.tag ? caseTagMigrate(model.tag) : null,
    involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
    createdAt: model.createdAt,
    assignedTo:
      ALL_MOCK_USERS.find((u) => u.id === model.assignedUserId) ?? null, // TODO: Implement this when auth is ready
    comments: model.comments.map((c) => caseCommentMigrate(c)),
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
  }
}
