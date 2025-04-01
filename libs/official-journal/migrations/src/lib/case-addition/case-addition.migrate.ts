import { CaseAddition } from '@dmr.is/official-journal/dto/case-addition/case-addition.dto'
import { CaseAdditionModel } from '@dmr.is/official-journal/models'

export const caseAdditionMigrate = (model: CaseAdditionModel): CaseAddition => {
  return {
    id: model.id,
    title: model.title,
    html: model.content,
  }
}
