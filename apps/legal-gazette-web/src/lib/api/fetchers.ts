import {
  DeleteCaseRequest,
  UpdateAdvertCategoryRequest,
  UpdateAdvertStatusRequest,
} from '../../gen/fetch'
import { getLegalGazetteClient } from './createClient'

type SWRFetcherArgs<T> = {
  func: () => Promise<T>
}

export const fetcher = async <T>({ func }: SWRFetcherArgs<T>): Promise<T> => {
  const res = await func()

  return res
}

export const setAdvertCategory = async (
  _url: string,
  {
    arg,
  }: {
    arg: UpdateAdvertCategoryRequest
  },
) => {
  const client = getLegalGazetteClient('AdvertCategoryApi', 'todo:add-token')

  await client.updateAdvertCategory(arg)
}

export const setAdvertStatus = async (
  _url: string,
  {
    arg,
  }: {
    arg: UpdateAdvertStatusRequest
  },
) => {
  const client = getLegalGazetteClient('AdvertStatusApi', 'todo:add-token')

  await client.updateAdvertStatus(arg)
}

export const rejectCase = async (
  _url: string,
  {
    arg,
  }: {
    arg: DeleteCaseRequest
  },
) => {
  const client = getLegalGazetteClient('CaseApi', 'todo:add-token')

  await client.deleteCase(arg)
}
