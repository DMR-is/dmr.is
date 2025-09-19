import { useSession } from 'next-auth/react'

import { getClient } from '../lib/createClient'

export const useClient = () => {
  const session = useSession()

  if (!session.data?.idToken) {
    throw new Error('Unauthorized')
  }

  return getClient(session.data.idToken)
}
