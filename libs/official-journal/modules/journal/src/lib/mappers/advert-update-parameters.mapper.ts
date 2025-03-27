import { UpdateAdvertBody } from '@dmr.is/shared/dto'

type UpdateParams = {
  departmentId?: string
  typeId?: string
  statusId?: string
  subject?: string
  serialNumber?: number
  publicationYear?: number
  title?: string
  documentHtml?: string
  documentPdfUrl?: string
  involvedPartyId?: string
  signatureDate?: Date
  publicationDate?: Date
  isLegacy?: boolean
}

export const advertUpdateParametersMapper = (
  body: UpdateAdvertBody,
): UpdateParams => {
  const updateParams: UpdateParams = {}

  if (body.departmentId) {
    updateParams.departmentId = body.departmentId
  }

  if (body.typeId) {
    updateParams.typeId = body.typeId
  }

  if (body.statusId) {
    updateParams.statusId = body.statusId
  }

  if (body.subject) {
    updateParams.subject = body.subject
  }

  if (body.serialNumber) {
    updateParams.serialNumber = body.serialNumber
  }

  if (body.publicationYear) {
    updateParams.publicationYear = body.publicationYear
  }
  if (body.documentHtml) {
    updateParams.documentHtml = body.documentHtml
  }

  if (body.documentPdfUrl) {
    updateParams.documentPdfUrl = body.documentPdfUrl
  }

  if (body.involvedPartyId) {
    updateParams.involvedPartyId = body.involvedPartyId
  }

  if (body.signatureDate) {
    updateParams.signatureDate = body.signatureDate
  }

  if (body.publicationDate) {
    updateParams.publicationDate = body.publicationDate
  }

  if (body.isLegacy) {
    updateParams.isLegacy = body.isLegacy
  }

  return updateParams
}
