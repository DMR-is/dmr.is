import { ResultWrapper } from '@dmr.is/types'

import { GetCommunicationSatusesResponse } from './dto/communication-status.dto'

export interface ICommunicationStatusService {
  getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  >
}

export const ICommunicationStatusService = Symbol('ICommunicationStatusService')
