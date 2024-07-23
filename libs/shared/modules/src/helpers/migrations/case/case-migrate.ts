import { ALL_MOCK_USERS } from '@dmr.is/mocks'
import { Case } from '@dmr.is/shared/dto'

import { CaseDto } from '../../../case/models'
import { caseStatusMapper } from '../../mappers'
import { caseCommunicationStatusMapper } from '../../mappers/case/communicationStatus.mapper'
import { advertCategoryMigrate } from '../advert/advert-category-migrate'
import { caseChannelMigrate } from './case-channel-migrate'
import { caseCommentMigrate } from './case-comment-migrate'
import { caseTagMigrate } from './case-tag-migrate'

export const caseMigrate = (model: CaseDto): Case => {
  const status = caseStatusMapper(model.status.value)

  if (!status) {
    throw new Error(`Unknown case status: ${model.status.value}`)
  }

  const communicationStatus = caseCommunicationStatusMapper(
    model.communicationStatus.value,
  )

  if (!communicationStatus) {
    throw new Error(
      `Unknown communication status: ${model.communicationStatus.value}`,
    )
  }

  return {
    id: model.id,
    applicationId: model.applicationId,
    year: model.year,
    caseNumber: model.caseNumber,
    status: status,
    tag: model.tag ? caseTagMigrate(model.tag) : null,
    createdAt: model.createdAt,
    assignedTo:
      ALL_MOCK_USERS.find((u) => u.id === model.assignedUserId) ?? null, // TODO: Implement this when auth is ready
    comments: model.comments.map((c) => caseCommentMigrate(c)),
    communicationStatus: communicationStatus,
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
    channels: model.channels.map((c) => caseChannelMigrate(c)),
  }
}
