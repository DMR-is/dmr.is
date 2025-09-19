import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { GetAdvertPublicationVersionEnum } from '../../gen/fetch'
import { authOptions } from '../authOptions'
import { getClient } from '../createClient'

export const getPublication = cache(
  async (id: string, version: GetAdvertPublicationVersionEnum) => {
    const session = await getServerSession(authOptions)

    if (!session?.idToken) throw new Error('Unauthorized')

    const client = getClient(session.idToken)

    const publication = await client.getAdvertPublication({
      advertId: id,
      version,
    })

    return publication
  },
)
