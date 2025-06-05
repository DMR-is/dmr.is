import { config } from '@dmr.is/api-client/createClient'

import {
  AdvertApi,
  AdvertCategoryApi,
  AdvertStatusApi,
  AdvertTypeApi,
  CaseApi,
  Configuration,
} from '../../gen/fetch'

const apis = [
  'AdvertApi',
  'CaseApi',
  'AdvertCategoryApi',
  'AdvertStatusApi',
  'AdvertTypeApi',
] as const

type ApiKey = (typeof apis)[number]

type ApiClientMap = {
  AdvertApi: AdvertApi
  CaseApi: CaseApi
  AdvertCategoryApi: AdvertCategoryApi
  AdvertStatusApi: AdvertStatusApi
  AdvertTypeApi: AdvertTypeApi
}

const ApiConstructors: {
  [K in ApiKey]: new (config: Configuration) => ApiClientMap[K]
} = {
  AdvertApi,
  CaseApi,
  AdvertCategoryApi,
  AdvertStatusApi,
  AdvertTypeApi,
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
    const client = new ClientClass(config(Configuration, token))
    //@ts-expect-error - TypeScript doesn't know about the dynamic nature of ApiClientMap
    apiClients[key] = { client, token }
    return client
  }

  return cached.client
}
