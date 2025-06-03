import { CaseModel } from '../case.model'
import { CaseDto } from './case.dto'

export const caseMigrate = (model: CaseModel): CaseDto => ({
  id: model.id,
  applicationId: model.applicationId === null ? undefined : model.applicationId,
  caseNumber: model.caseNumber,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})
