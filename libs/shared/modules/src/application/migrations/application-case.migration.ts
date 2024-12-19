import { ApplicationCase } from '@dmr.is/shared/dto'

import { caseCommunicationStatusMigrate } from '../../case/migrations/case-communication-status.migrate'
import { CaseModel } from '../../case/models'
import {
  advertCategoryMigrate,
  advertDepartmentMigrate,
} from '../../journal/migrations'

export const applicationCaseMigrate = (model: CaseModel): ApplicationCase => {
  const fullHtml = `
    ${model.html}
    ${model.signatures?.map((signature) => signature.html).join('')}
  `

  return {
    department: advertDepartmentMigrate(model.department),
    type: model.advertType,
    status: model.status,
    categories: model.categories
      ? model.categories.map((c) => advertCategoryMigrate(c))
      : [],
    communicationStatus: caseCommunicationStatusMigrate(
      model.communicationStatus,
    ),
    html: fullHtml,
  }
}
