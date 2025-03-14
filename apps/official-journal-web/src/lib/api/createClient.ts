import { Configuration, DefaultApi } from '../../gen/fetch'
import { createEnhancedFetch } from './createEnhancedFetch'

const getPath = () => {
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000'
  }

  if (typeof window === 'undefined') {
    return process.env.DMR_ADMIN_API_BASE_PATH as string
  }
  // Removing first part of the domain (ritstjorn) and adding admin-api
  const host = window.location.host.split('.')
  host.shift()
  host.unshift('admin-api')
  return `https://${host.join('.')}`
}

export const config = (token: string) => {
  return new Configuration({
    fetchApi: createEnhancedFetch(),
    accessToken: token,
    basePath: getPath(),
  })
}

let dmrClient: DefaultApi | undefined

export const getDmrClient = (accessToken: string) => {
  if (typeof window === 'undefined') {
    // Server: always make a new dmr client

    return new DefaultApi(config(accessToken))
  }

  // Browser: use singleton pattern to keep the same dmr client
  return (dmrClient ??= new DefaultApi(config(accessToken)))
}
