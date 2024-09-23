import { ApplicationUser } from '@dmr.is/shared/dto'
import { withTryCatch } from '@dmr.is/utils'

import { advertInvolvedPartyMigrate } from '../../journal/migrations'
import { ApplicationUserModel } from '../models'

export const applicationUserMigrate = (
  model: ApplicationUserModel,
): ApplicationUser => {
  return withTryCatch(
    () => ({
      id: model.id,
      nationalId: model.nationalId,
      firstName: model.firstName,
      lastName: model.lastName,
      email: model.email,
      phone: model.phone,
      involvedParties: model.involvedParties.map((involvedParty) =>
        advertInvolvedPartyMigrate(involvedParty),
      ),
    }),
    `Failed to migrate ApplicationUserModel<${model.id}>`,
  )
}
