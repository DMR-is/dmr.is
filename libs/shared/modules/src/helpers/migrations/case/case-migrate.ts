import { Case } from '@dmr.is/shared/dto'

import { CaseDto } from '../../../case/models'
import { caseStatusMapper } from '../../mappers'
import { caseCommunicationStatusMapper } from '../../mappers/case/communicationStatus.mapper'
import { caseTagMapper } from '../../mappers/case/tag.mapper'
import { caseCommentMigrate } from './case-comment-migrate'

export const caseMigrate = (model: CaseDto): Case => {
  const status = caseStatusMapper(model.status.value)

  if (!status) {
    throw new Error(`Unknown case status: ${model.status.value}`)
  }

  const caseTag = caseTagMapper(model?.tag?.value)

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
    tag: caseTag,
    createdAt: model.createdAt,
    assignedTo: null, // TODO: Implement this when auth is ready
    comments: model.comments.map((c) => caseCommentMigrate(c)),
    communicationStatus: communicationStatus,
    fastTrack: model.fastTrack,
    isLegacy: model.isLegacy,
    modifiedAt: model.updatedAt,
    paid: model.paid ?? false,
    price: model.price,
    publishedAt: model.publishedAt,
  }
}