import { config } from '@dmr.is/api-client/createClient'

import {
  AdvertApi,
  CaseApi,
  CaseCategoryApi,
  CaseStatusApi,
  CaseTypeApi,
  Configuration,
} from '../../gen/fetch'

const apis = [
  'AdvertApi',
  'CaseApi',
  'CaseCategoryApi',
  'CaseStatusApi',
  'CaseTypeApi',
] as const

type ApiKey = (typeof apis)[number]

type ApiClientMap = {
  AdvertApi: AdvertApi
  CaseApi: CaseApi
  CaseCategoryApi: CaseCategoryApi
  CaseStatusApi: CaseStatusApi
  CaseTypeApi: CaseTypeApi
}

const ApiConstructors: {
  [K in ApiKey]: new (config: Configuration) => ApiClientMap[K]
} = {
  AdvertApi,
  CaseApi,
  CaseCategoryApi,
  CaseStatusApi,
  CaseTypeApi,
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
