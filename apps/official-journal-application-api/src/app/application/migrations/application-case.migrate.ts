import { CaseModel } from '@dmr.is/official-journal/models'
import { ApplicationCase } from '@dmr.is/official-journal/modules/attachment'
import { baseEntityMigrate } from '@dmr.is/shared/dto'

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
    type: baseEntityMigrate(model.advertType),
    status: baseEntityMigrate(model.status),
    categories: model.categories
      ? model.categories.map((c) => baseEntityMigrate(c))
      : [],
    communicationStatus: baseEntityMigrate(model.communicationStatus),
    html: fullHtml,
  }
}
