import { DMRUser } from '@dmr.is/auth/dmrUser'

import {
  IslandIsCommonApplicationUpdateStateEventDto,
  IslandIsSubmitCommonApplicationDto,
} from './dto/island-is-application.dto'

export interface IIslandIsCommonApplicationService {
  submitApplication(
    body: IslandIsSubmitCommonApplicationDto,
    user: DMRUser,
  ): Promise<void>

  updateApplicationState(
    body: IslandIsCommonApplicationUpdateStateEventDto,
  ): Promise<void>

  deleteApplication(id: string, user: DMRUser): Promise<void>
}

export const IIslandIsCommonApplicationService = Symbol(
  'IIslandIsCommonApplicationService',
)
