import { CaseCommunicationStatusModel } from '@dmr.is/official-journal/models'
import { enumMapper } from '@dmr.is/utils'
import { CaseCommunicationStatus } from '../dto/case-constants'
import { CommunicationStatus } from '../dto/communication-status.dto'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    title: enumMapper(model.title, CaseCommunicationStatus),
    slug: model.slug,
  }

  return migrated
}
