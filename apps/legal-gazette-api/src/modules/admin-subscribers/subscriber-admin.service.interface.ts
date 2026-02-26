import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'

import {
  SubscriberDto,
} from '../../models/subscriber.model'
import {
  CreateSubscriberAdminDto,
  GetSubscribersWithPagingResponse,
  UpdateSubscriberEndDateDto,
} from '../subscribers/dto/subscriber.dto'

export interface ISubscriberAdminService {
  getSubscribers(
    query: PagingQuery,
    includeInactive?: boolean,
  ): Promise<GetSubscribersWithPagingResponse>

  createSubscriber(
    body: CreateSubscriberAdminDto,
    user: DMRUser,
  ): Promise<SubscriberDto>

  updateSubscriberEndDate(
    subscriberId: string,
    body: UpdateSubscriberEndDateDto,
    user: DMRUser,
  ): Promise<SubscriberDto>

  deactivateSubscriber(subscriberId: string, user: DMRUser): Promise<void>

  activateSubscriber(subscriberId: string, user: DMRUser): Promise<SubscriberDto>
}

export const ISubscriberAdminService = Symbol('ISubscriberAdminService')
