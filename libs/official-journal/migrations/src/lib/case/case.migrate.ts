import { CaseModel } from '@dmr.is/official-journal/models'
import { Case } from '@dmr.is/official-journal/dto/case/case.dto'
import { baseEntityMigrate } from '@dmr.is/shared/dto'
import { advertTypeMigrate } from '../advert-type/advert-type.migrate'
import { institutionMigrate } from '../institution/institution.migrate'
import { communicationStatusMigrate } from '../communication-status/communication-status.migrate'
import { caseStatusMigrate } from '../case-status/case-status.migrate'
import { caseTagMigrate } from '../case-tag/case-tag.migrate'

export const caseMigrate = (model: CaseModel): Case => ({
  id: model.id,
  status: caseStatusMigrate(model.status),
  communicationStatus: communicationStatusMigrate(model.communicationStatus),
  involvedParty: institutionMigrate(model.involvedParty),
  advertDepartment: baseEntityMigrate(model.department),
  advertType: advertTypeMigrate(model.advertType),
  advertCategories: model.categories?.map((c) => baseEntityMigrate(c)) || [],
  advertTitle: model.advertTitle,
  requestedPublicationDate: model.requestedPublicationDate,
  year: model.year,
  publicationNumber: model.publicationNumber,
  publishedAt: model.publishedAt,
  createdAt: model.createdAt,
  fastTrack: model.fastTrack,
  assignedTo: null,
  tag: model?.tag ? caseTagMigrate(model.tag) : null,
})
