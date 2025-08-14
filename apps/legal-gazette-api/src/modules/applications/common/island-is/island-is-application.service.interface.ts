import { DMRUser } from '@dmr.is/auth/dmrUser'

import {
  CommonApplicationUpdateStateEvent,
  SubmitCommonApplicationDto,
} from './dto/island-is-application.dto'

export interface IIslandIsCommonApplicationService {
  submitApplication(
    body: SubmitCommonApplicationDto,
    user: DMRUser,
  ): Promise<void>

  updateApplicationState(body: CommonApplicationUpdateStateEvent): Promise<void>

  deleteApplication(id: string, user: DMRUser): Promise<void>
}

export const IIslandIsCommonApplicationService = Symbol(
  'IIslandIsCommonApplicationService',
)
