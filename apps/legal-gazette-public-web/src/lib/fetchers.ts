import { getSession } from 'next-auth/react'

import {
  ApiErrorDto,
  GetAdvertPdfRequest,
  GetAdvertsRequest,
  LegalGazettePublicAPIApi,
} from '../gen/fetch'
import { getClient } from './createClient'

type SafeReturnType<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ApiErrorDto
    }

export const serverFetcher = async <T>(
  func: () => Promise<T>,
): Promise<SafeReturnType<T>> => {
  try {
    const res = await func()
    return {
      data: res,
      error: null,
    }
  } catch (error) {
    const err = await (error as Response).json()
    return {
      data: null,
      error: err as ApiErrorDto,
    }
  }
}

type SWRFetcherArgs<ReturnType> = (
  client: LegalGazettePublicAPIApi,
) => Promise<ReturnType>

export const fetcher = async <ReturnType>(
  func: SWRFetcherArgs<ReturnType>,
): Promise<ReturnType> => {
  const session = await getSession()

  if (!session) {
    throw new Error('No session found')
  }
  const client = getClient(session.idToken)

  const res = await func(client)

  return res
}

export const getLatestAdverts = async () => {
  return fetcher((client) =>
    client.getAdverts({
      page: 1,
      pageSize: 5,
    }),
  )
}

export const getAdvertPdf = async (arg: GetAdvertPdfRequest) => {
  return fetcher((client) => client.getAdvertPdf(arg))
}

export const getAdverts = (arg: GetAdvertsRequest) => {
  return fetcher((client) => client.getAdverts(arg))
}
