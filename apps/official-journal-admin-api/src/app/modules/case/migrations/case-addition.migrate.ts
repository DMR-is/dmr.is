import { CaseAdditionModel } from '@dmr.is/official-journal/models'
import { CaseAddition } from '../dto/case-addition.dto'

export const caseAdditionMigrate = (model: CaseAdditionModel): CaseAddition => {
  return {
    id: model.id,
    title: model.title,
    html: model.content,
  }
}
