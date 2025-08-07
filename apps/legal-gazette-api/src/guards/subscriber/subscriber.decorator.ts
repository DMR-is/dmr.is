import { SetMetadata } from '@nestjs/common'

import { Subscription } from './subscriber.enum'

export const SUBSCRIPTION_KEY = 'subscription'

export const Subscriptions = (...subscriptions: Subscription[]) =>
  SetMetadata(SUBSCRIPTION_KEY, subscriptions)
