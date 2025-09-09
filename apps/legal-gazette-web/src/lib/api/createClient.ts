import { config } from '@dmr.is/api-client/createClient'

import {
  AdvertApi,
  AdvertPdfApi,
  AdvertPublicationsApi,
  AdvertPublishApi,
  AdvertUpdateApi,
  ApplicationApi,
  CaseApi,
  CategoryApi,
  Configuration,
  CourtDistrictApi,
  HealthApi,
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
  'ApplicationApi',
  'AdvertPdfApi',
  'AdvertPublicationsApi',
  'CourtDistrictApi',
  'HealthApi',
  'SubscriberApi',
] as const

type ApiKey = (typeof apis)[number]

export type ApiClientMap = {
  AdvertApi: AdvertApi
  AdvertPublishApi: AdvertPublishApi
  AdvertUpdateApi: AdvertUpdateApi
  CaseApi: CaseApi
  CategoryApi: CategoryApi
  StatusApi: StatusApi
  TypeApi: TypeApi
  UsersApi: UsersApi
  ApplicationApi: ApplicationApi
  AdvertPdfApi: AdvertPdfApi
  AdvertPublicationsApi: AdvertPublicationsApi
  CourtDistrictApi: CourtDistrictApi
  HealthApi: HealthApi
  SubscriberApi: SubscriberApi
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
  ApplicationApi,
  AdvertPdfApi,
  AdvertPublicationsApi,
  CourtDistrictApi,
  HealthApi,
  SubscriberApi,
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
