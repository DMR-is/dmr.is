import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

import type { AppRouter } from './server/routers/_app'

type RouterOutputs = inferRouterOutputs<AppRouter>
type RouterInputs = inferRouterInputs<AppRouter>

export type AdvertDetails = RouterOutputs['getAdvert']
export type AdvertComment = AdvertDetails['comments'][number]
export type AdvertPublication = AdvertDetails['publications'][number]
export type AdvertChannel = AdvertDetails['communicationChannels'][number]
export type AdvertSettlement = NonNullable<AdvertDetails['settlement']>
export type AdvertSignature = NonNullable<AdvertDetails['signature']>

export type BaseEntities = RouterOutputs['getAllEntities']
export type EntityType = BaseEntities['types'][number]
export type EntityCategory = BaseEntities['categories'][number]
export type EntityCourtDistrict = BaseEntities['courtDistricts'][number]
export type EntityStatus = BaseEntities['statuses'][number]

export type TbrSettingsResult = RouterOutputs['getTbrSettings']
export type TbrSettingItem = TbrSettingsResult['items'][number]
export type TbrSettingsPaging = TbrSettingsResult['paging']

export type PaymentsResult = RouterOutputs['getPayments']
export type PaymentItem = PaymentsResult['payments'][number]
export type PaymentsPaging = PaymentsResult['paging']

export type UpdateAdvertInput = RouterInputs['updateAdvert']
export type UpdateSignatureInput = RouterInputs['updateSignature']
export type UpdateSettlementInput = RouterInputs['updateSettlementSchema']
export type UpdatePublicationInput = RouterInputs['updatePublication']
export type CreateSubscriberInput = RouterInputs['createSubscriber']
export type UpdateSubscriberInput = RouterInputs['updateSubscriberEndDate']
