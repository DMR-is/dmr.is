import { Case } from '@dmr.is/shared/dto'

import { CaseModel } from '../models'

export const caseMigrate = (model: CaseModel): Case => ({
  id: model.id,
  status: {
    id: model.status.id,
    title: model.status.title,
    slug: model.status.slug,
  },
  communicationStatus: {
    id: model.communicationStatus.id,
    title: model.communicationStatus.title,
    slug: model.communicationStatus.slug,
  },
  involvedParty: {
    id: model.involvedParty.id,
    title: model.involvedParty.title,
    slug: model.involvedParty.slug,
  },
  advertDepartment: model.department,
  advertType: model.advertType,
  advertTitle: model.advertTitle,
  requestedPublicationDate: model.requestedPublicationDate,
  publicationNumber: model.publicationNumber,
  publishedAt: model.publishedAt,
  createdAt: model.createdAt,
  fastTrack: model.fastTrack,
  assignedTo: null,
  tag: model?.tag ? model.tag : null,
})
