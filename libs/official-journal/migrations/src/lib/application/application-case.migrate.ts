import { ApplicationCase } from '@dmr.is/official-journal/dto/application/application-case.dto'
import { CaseModel } from '@dmr.is/official-journal/models'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

import { advertTypeMigrate } from '../advert-type/advert-type.migrate'
import { caseStatusMigrate } from '../case-status/case-status.migrate'
import { communicationStatusMigrate } from '../communication-status/communication-status.migrate'

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
    department: baseEntityMigrate(model.department),
    type: advertTypeMigrate(model.advertType),
    status: caseStatusMigrate(model.status),
    categories: model.categories
      ? model.categories.map((c) => baseEntityMigrate(c))
      : [],
    communicationStatus: communicationStatusMigrate(model.communicationStatus),
    html: fullHtml,
  }
}
