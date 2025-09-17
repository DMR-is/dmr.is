import { getSession } from 'next-auth/react'

import {
  DeleteCaseRequest,
  GetCategoriesRequest,
  PublishAdvertsRequest,
  UpdateAdvertCategoryRequest,
  UpdateAdvertRequest,
  UpdateAdvertStatusRequest,
} from '../../gen/fetch'
import { ApiClientMap, getLegalGazetteClient } from './createClient'

type SWRFetcherArgs<T extends keyof ApiClientMap, ReturnType> = (
  client: ApiClientMap[T],
) => Promise<ReturnType>

export const fetcher = async <T extends keyof ApiClientMap, ReturnType>(
  func: SWRFetcherArgs<T, ReturnType>,
  api: T,
): Promise<ReturnType> => {
  const session = await getSession()

  if (!session) {
    throw new Error('No session found')
  }
  const client = getLegalGazetteClient(api, session.idToken)

  const res = await func(client)

  return res
}

export const fetchCategories = async (
  _url: string,
  params: GetCategoriesRequest = {},
) => {
  return fetcher((client) => client.getCategories(params), 'CategoryApi')
}

export const setAdvertCategory = async (
  _url: string,
  {
    arg,
  }: {
    arg: UpdateAdvertCategoryRequest
  },
) => {
  return fetcher(
    (client) => client.updateAdvertCategory(arg),
    'AdvertUpdateApi',
  )
}

export const setAdvertStatus = async (
  _url: string,
  {
    arg,
  }: {
    arg: UpdateAdvertStatusRequest
  },
) => {
  return fetcher((client) => client.updateAdvertStatus(arg), 'AdvertUpdateApi')
}

export const rejectCase = async (
  _url: string,
  {
    arg,
  }: {
    arg: DeleteCaseRequest
  },
) => {
  return fetcher((client) => client.deleteCase(arg), 'CaseApi')
}

export const updateAdvert = async (
  _url: string,
  { arg }: { arg: UpdateAdvertRequest },
) => {
  return fetcher((client) => client.updateAdvert(arg), 'AdvertUpdateApi')
}

export const publishAdverts = async (
  _url: string,
  { arg }: { arg: PublishAdvertsRequest },
) => {
  return fetcher((client) => client.publishAdverts(arg), 'AdvertPublishApi')
}
