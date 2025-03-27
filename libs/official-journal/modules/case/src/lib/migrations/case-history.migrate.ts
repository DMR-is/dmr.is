import { CaseHistoryModel } from '@dmr.is/official-journal/models'
import { CaseHistory } from '../dto/case-history.dto'

export const caseHistoryMigrate = (model: CaseHistoryModel): CaseHistory => {
  return {
    id: model.id,
    caseId: model.caseId,
    department: model.department,
    type: model.type,
    status: model.status,
    institution: model.involvedParty,
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
