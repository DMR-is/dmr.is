import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { SubscriberDto } from '../../models/subscriber.model'
import { MutationResponse } from '../../modules/shared/dto/mutation.dto'
export interface ISubscriberService {
  getUserByNationalId(nationalId: DMRUser): Promise<SubscriberDto>
  createSubscriptionForUser(user: DMRUser): Promise<MutationResponse>
}

export const ISubscriberService = Symbol('ISubscriberService')
