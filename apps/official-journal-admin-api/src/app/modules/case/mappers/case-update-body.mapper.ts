import { CaseModel } from '@dmr.is/official-journal/models'
import { getFastTrack } from '@dmr.is/utils'

import { UpdateCaseBody } from '../dto/update-case-body.dto'
export const updateCaseBodyMapper = (
  body: UpdateCaseBody,
): Partial<CaseModel> => {
  const requestedPublicationDate = body.requestedPublicationDate
    ? new Date(body.requestedPublicationDate)
    : new Date()

  const { fastTrack, now } = getFastTrack(requestedPublicationDate)

  const updateData: Partial<CaseModel> = {
    updatedAt: now.toISOString(), // Always include updatedAt
  }

  if (body.advertTitle !== undefined) {
    updateData.advertTitle = body.advertTitle
  }
  if (body.departmentId !== undefined) {
    updateData.departmentId = body.departmentId
  }
  if (body.advertTypeId !== undefined) {
    updateData.advertTypeId = body.advertTypeId
  }
  if (body.requestedPublicationDate !== undefined) {
    updateData.requestedPublicationDate = body.requestedPublicationDate
  }
  if (fastTrack !== undefined) {
    updateData.fastTrack = fastTrack
  }
  if (body.message !== undefined) {
    updateData.message = body.message
  }

  return updateData
}
