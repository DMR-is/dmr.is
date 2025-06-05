import { advertDetailedMigrate } from '../../advert/dto/advert.migrate'
import { CaseModel } from '../case.model'
import { CaseDetailedDto, CaseDto } from './case.dto'

export const caseMigrate = (model: CaseModel): CaseDto => ({
  id: model.id,
  applicationId: model.applicationId === null ? undefined : model.applicationId,
  caseNumber: model.caseNumber,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
})

export const caseDetailedMigrate = (model: CaseModel): CaseDetailedDto => ({
  id: model.id,
  applicationId: model.applicationId === null ? undefined : model.applicationId,
  caseNumber: model.caseNumber,
  createdAt: model.createdAt.toISOString(),
  updatedAt: model.updatedAt.toISOString(),
  deletedAt: model.deletedAt ? model.deletedAt.toISOString() : null,
  adverts: model.adverts.map((advert) => advertDetailedMigrate(advert)),
  communicationChannels: model.communicationChannels.map((channel) => ({
    email: channel.email,
    phone: channel.phone ? channel.phone : undefined,
    name: channel.name ? channel.name : undefined,
  })),
})
