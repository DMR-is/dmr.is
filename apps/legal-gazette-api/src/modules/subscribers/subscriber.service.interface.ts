import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { MutationResponse } from '../../core/dto/mutation.do'
import { SubscriberDto } from '../../models/subscriber.model'
export interface ISubscriberService {
  getUserByNationalId(nationalId: DMRUser): Promise<SubscriberDto>
  createSubscriptionForUser(user: DMRUser): Promise<MutationResponse>
}

export const ISubscriberService = Symbol('ISubscriberService')
