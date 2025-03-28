import { CaseModel } from '@dmr.is/official-journal/models'
import { ApplicationCase } from '@dmr.is/official-journal/modules/attachment'
import { caseCommunicationStatusMigrate } from '@dmr.is/official-journal/modules/case'
import {
  advertDepartmentMigrate,
  advertCategoryMigrate,
} from '@dmr.is/official-journal/modules/journal'

export const applicationCaseMigrate = (model: CaseModel): ApplicationCase => {
  let fullHtml = `
    ${model.html}
    ${model.signature.html}
  `

  const additonHtml = model.additions?.map((a) => a.content).join('')

  if (additonHtml) {
    fullHtml += additonHtml
  }

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
