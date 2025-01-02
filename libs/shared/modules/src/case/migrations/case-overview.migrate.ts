import { CaseOverview } from '@dmr.is/shared/dto'

import { CaseModel } from '../models'

export const caseOverviewMigrate = (model: CaseModel): CaseOverview => ({
  id: model.id,
  advertDepartment: model.department,
  communicationStatus: {
    id: model.communicationStatus.id,
    title: model.communicationStatus.title,
    slug: model.communicationStatus.slug,
  },
  requestedPublicationDate: '',
  createdAt: '',
  advertTitle: '',
  fastTrack: false,
  assignedTo: null,
  tag: model?.tag ? model.tag : null,
})
