import {
  DeleteCaseRequest,
  GetCategoriesRequest,
  UpdateAdvertCategoryRequest,
  UpdateAdvertStatusRequest,
  UpdateCommonAdvertRequest,
} from '../../gen/fetch'
import { getLegalGazetteClient } from './createClient'

type SWRFetcherArgs<T> = {
  func: () => Promise<T>
}

export const fetcher = async <T>({ func }: SWRFetcherArgs<T>): Promise<T> => {
  const res = await func()

  return res
}

export const fetchCategories = async (
  _url: string,
  params: GetCategoriesRequest = {},
) => {
  const client = getLegalGazetteClient('CategoryApi', 'todo:add-token')

  return await client.getCategories(params)
}

export const fetchCase = async (_url: string, id: string) => {
  const client = getLegalGazetteClient('CaseApi', 'todo:add-token')

  return await client.getCase({ id })
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

export const updateCommonAdvert = async (
  _url: string,
  { arg }: { arg: UpdateCommonAdvertRequest },
) => {
  const client = getLegalGazetteClient('CommonAdvertApi', 'todo:add-token')

  await client.updateCommonAdvert(arg)
}
