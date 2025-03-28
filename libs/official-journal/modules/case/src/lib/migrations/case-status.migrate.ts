import {
  CaseStatusEnum,
  CaseStatusModel,
} from '@dmr.is/official-journal/models'
import { enumMapper } from '@dmr.is/utils'
import { CaseStatus } from '../dto/case-status.dto'

export const caseStatusMigrate = (model: CaseStatusModel): CaseStatus => {
  return {
    id: model.id,
    title: enumMapper(model.title, CaseStatusEnum),
    slug: model.slug,
  }
}
