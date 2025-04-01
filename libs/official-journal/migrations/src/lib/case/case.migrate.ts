import { CaseModel } from '@dmr.is/official-journal/models'
import { Case } from '@dmr.is/official-journal/dto/case/case.dto'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

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
    nationalId: model.involvedParty.nationalId,
  },
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
  advertCategories: model.categories?.map((c) => baseEntityMigrate(c)) || [],
  requestedPublicationDate: model.requestedPublicationDate,
  publicationNumber: model.publicationNumber,
  publishedAt: model.publishedAt,
  createdAt: model.createdAt,
  fastTrack: model.fastTrack,
  assignedTo: null,
  tag: model?.tag ? model.tag : null,
})
