import { CaseModel } from '@dmr.is/official-journal/models'
import {
  advertInvolvedPartyMigrate,
  advertCategoryMigrate,
} from '@dmr.is/official-journal/modules/journal'
import { Case } from '../dto/case.dto'

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
  involvedParty: advertInvolvedPartyMigrate(model.involvedParty),
  advertDepartment: {
    id: model.department.id,
    title: model.department.title,
    slug: model.department.slug,
  },
  advertType: {
    id: model.advertType.id,
    title: model.advertType.title,
    slug: model.advertType.slug,
  },
  year: model.year,
  advertTitle: model.advertTitle,
  advertCategories:
    model.categories?.map((c) => advertCategoryMigrate(c)) || [],
  requestedPublicationDate: model.requestedPublicationDate,
  publicationNumber: model.publicationNumber,
  publishedAt: model.publishedAt,
  createdAt: model.createdAt,
  fastTrack: model.fastTrack,
  assignedTo: null,
  tag: model?.tag ? model.tag : null,
})
