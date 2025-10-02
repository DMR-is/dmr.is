'use server'

import { GetAdvertsInProgressRequest } from '../gen/fetch'
import { getServerClient } from '../lib/api/serverClient'

export async function getAdvertsInProgress(query: GetAdvertsInProgressRequest) {
  const client = await getServerClient('AdvertApi')

  return await client.getAdvertsInProgress(query)
}
