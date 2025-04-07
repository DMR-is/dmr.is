import { CaseHistory } from '@dmr.is/official-journal/dto/case-history/case-history.dto'
import { CaseHistoryModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { advertTypeMigrate } from '../advert-type/advert-type.migrate'
import { caseStatusMigrate } from '../case-status/case-status.migrate'
import { institutionMigrate } from '../institution/institution.migrate'

export const caseHistoryMigrate = (model: CaseHistoryModel): CaseHistory => {
  return {
    id: model.id,
    caseId: model.caseId,
    department: baseEntityMigrate(model.department),
    type: advertTypeMigrate(model.type),
    status: caseStatusMigrate(model.status),
    institution: institutionMigrate(model.involvedParty),
    assignedTo: model.adminUser
      ? {
          id: model.adminUser?.id,
          displayName: model.adminUser?.displayName,
        }
      : null,
    title: model.title,
    html: model.html,
    requestedPublicationDate: model.requestedPublicationDate,
    created: model.created,
  }
}
