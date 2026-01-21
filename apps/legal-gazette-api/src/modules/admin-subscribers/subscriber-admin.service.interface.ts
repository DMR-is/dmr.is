import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PagingQuery } from '@dmr.is/shared/dto'

import {
  CreateSubscriberAdminDto,
  GetSubscribersWithPagingResponse,
  SubscriberDto,
  UpdateSubscriberEndDateDto,
} from '../../models/subscriber.model'

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
