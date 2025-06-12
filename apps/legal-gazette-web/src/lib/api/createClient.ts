import { config } from '@dmr.is/api-client/createClient'

import {
  AdvertApi,
  AdvertCategoryApi,
  AdvertStatusApi,
  CaseApi,
  CategoryApi,
  CommonAdvertApi,
  Configuration,
  StatusApi,
  TypeApi,
} from '../../gen/fetch'

const apis = [
  'AdvertApi',
  'AdvertStatusApi',
  'AdvertCategoryApi',
  'CaseApi',
  'CategoryApi',
  'CommonAdvertApi',
  'StatusApi',
  'TypeApi',
] as const

type ApiKey = (typeof apis)[number]

type ApiClientMap = {
  AdvertApi: AdvertApi
  AdvertStatusApi: AdvertStatusApi
  AdvertCategoryApi: AdvertCategoryApi
  CaseApi: CaseApi
  CategoryApi: CategoryApi
  CommonAdvertApi: CommonAdvertApi
  StatusApi: StatusApi
  TypeApi: TypeApi
}

const ApiConstructors: {
  [K in ApiKey]: new (config: Configuration) => ApiClientMap[K]
} = {
  AdvertApi,
  AdvertStatusApi,
  AdvertCategoryApi,
  CaseApi,
  CategoryApi,
  CommonAdvertApi,
  StatusApi,
  TypeApi,
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
