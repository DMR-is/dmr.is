import { CommunicationStatus } from '@dmr.is/shared/dto'

import { caseCommunicationStatusMapper } from '../mappers/case-communication-status.mapper'
import { CaseCommunicationStatusModel } from '../models'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    title: caseCommunicationStatusMapper(model.title),
    slug: model.slug,
  }

  return migrated
}
