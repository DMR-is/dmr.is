import { CommunicationStatus } from '@dmr.is/official-journal/dto/communication-status/communication-status.dto'
import { CaseCommunicationStatusModel } from '@dmr.is/official-journal/models'

export const communicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => ({
  id: model.id,
  title: model.title,
  slug: model.slug,
})
