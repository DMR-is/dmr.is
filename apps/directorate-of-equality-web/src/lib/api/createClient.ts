import type { Client } from '../../gen/fetch/client'
import { createClient, createConfig } from '../../gen/fetch/client'

const getBaseUrl = () => {
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:5100'
  return process.env.DOE_API_BASE_PATH as string
}

export const getDoEClient = (token: string): Client => {
  return createClient(
    createConfig({
      baseUrl: getBaseUrl(),
      auth: token,
      throwOnError: true,
    }),
  )
}
