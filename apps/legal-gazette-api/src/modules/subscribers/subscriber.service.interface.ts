import { DMRUser } from '@dmr.is/auth/dmrUser'

import { SubscriberDto } from '../../models/subscriber.model'

export interface ISubscriberService {
  getUserByNationalId(nationalId: DMRUser): Promise<SubscriberDto>
}

export const ISubscriberService = Symbol('ISubscriberService')
