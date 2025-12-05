import { config } from '@dmr.is/api-client/createClient'

import {
  AdvertApi,
  AdvertCreateApi,
  AdvertPdfApi,
  AdvertPublicationApi,
  AdvertPublishApi,
  AdvertUpdateApi,
  ApplicationApi,
  CaseApi,
  CategoryApi,
  CommentApi,
  CommunicationChannelApi,
  Configuration,
  CourtDistrictApi,
  HealthApi,
  SettlementApi,
  SignatureApi,
  StatisticsApi,
  StatusApi,
  SubscriberApi,
  TypeApi,
  UsersApi,
} from '../../gen/fetch'

const apis = [
  'AdvertApi',
  'AdvertPublishApi',
  'AdvertUpdateApi',
  'CaseApi',
  'CategoryApi',
  'StatusApi',
  'TypeApi',
  'UsersApi',
  'SignatureApi',
  'StatisticsApi',
  'ApplicationApi',
  'AdvertPdfApi',
  'AdvertPublicationApi',
  'CourtDistrictApi',
  'HealthApi',
  'SubscriberApi',
  'SettlementApi',
  'CommentApi',
  'CommunicationChannelApi',
  'AdvertCreateApi',
] as const

export type ApiKey = (typeof apis)[number]

export type ApiClientMap = {
  AdvertApi: AdvertApi
  AdvertPublishApi: AdvertPublishApi
  AdvertUpdateApi: AdvertUpdateApi
  CaseApi: CaseApi
  CategoryApi: CategoryApi
  StatusApi: StatusApi
  TypeApi: TypeApi
  UsersApi: UsersApi
  SignatureApi: SignatureApi
  StatisticsApi: StatisticsApi
  ApplicationApi: ApplicationApi
  AdvertPdfApi: AdvertPdfApi
  AdvertPublicationApi: AdvertPublicationApi
  CourtDistrictApi: CourtDistrictApi
  HealthApi: HealthApi
  SubscriberApi: SubscriberApi
  SettlementApi: SettlementApi
  CommentApi: CommentApi
  CommunicationChannelApi: CommunicationChannelApi
  AdvertCreateApi: AdvertCreateApi
}

const ApiConstructors: {
  [K in ApiKey]: new (config: Configuration) => ApiClientMap[K]
} = {
  AdvertApi,
  AdvertPublishApi,
  AdvertUpdateApi,
  CaseApi,
  CategoryApi,
  StatusApi,
  TypeApi,
  UsersApi,
  SignatureApi,
  StatisticsApi,
  ApplicationApi,
  AdvertPdfApi,
  AdvertPublicationApi,
  CourtDistrictApi,
  HealthApi,
  SubscriberApi,
  SettlementApi,
  CommentApi,
  CommunicationChannelApi,
  AdvertCreateApi,
}

const apiClients: Partial<{
  [K in ApiKey]: { client: ApiClientMap[K]; token: string }
}> = {}

export const getLegalGazetteClient = <T extends ApiKey>(
  key: T,
  token: string,
): ApiClientMap[T] => {
  const cached = apiClients[key]

  if (typeof window === 'undefined' || !cached || cached.token !== token) {
    const ClientClass = ApiConstructors[key]
    const client = new ClientClass(config(Configuration, token, 'LGAdmin'))

    //@ts-expect-error - TypeScript doesn't know about the dynamic nature of ApiClientMap
    apiClients[key] = { client, token }
    return client
  }

  return cached.client
}
