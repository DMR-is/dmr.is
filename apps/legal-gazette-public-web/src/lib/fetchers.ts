import { GetAdvertPdfRequest, GetAdvertsRequest } from '../gen/fetch'
import { getClient } from './createClient'

export const getLatestAdverts = async () => {
  const client = getClient('todo:add-token')

  return await client.getAdverts({
    page: 1,
    pageSize: 5,
  })
}

export const getAdvertPdf = async (arg: GetAdvertPdfRequest) => {
  const client = getClient('todo:add-token')

  return await client.getAdvertPdf(arg)
}

export const getAdverts = (arg: GetAdvertsRequest) => {
  const client = getClient('todo:add-token')

  return client.getAdverts(arg)
}
