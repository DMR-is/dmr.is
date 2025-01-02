import { CaseOverview } from '@dmr.is/shared/dto'

import { CaseModel } from '../models'

export const caseOverviewMigrate = (model: CaseModel): CaseOverview => ({
  id: model.id,
  advertDepartment: model.department,
  advertType: model.advertType,
  communicationStatus: {
    id: model.communicationStatus.id,
    title: model.communicationStatus.title,
    slug: model.communicationStatus.slug,
  },
  requestedPublicationDate: model.requestedPublicationDate,
  createdAt: model.createdAt,
  advertTitle: model.advertTitle,
  fastTrack: model.fastTrack,
  assignedTo: null,
  tag: model?.tag ? model.tag : null,
})
