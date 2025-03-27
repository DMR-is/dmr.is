import { CaseAddition } from '@dmr.is/shared/dto'

import { CaseAdditionModel } from '../models'

export const caseAdditionMigrate = (model: CaseAdditionModel): CaseAddition => {
  return {
    id: model.id,
    title: model.title,
    html: model.content,
  }
}
