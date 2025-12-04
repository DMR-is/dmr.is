import { getServerSession } from 'next-auth'

import { authOptions } from '../authOptions'
import { getClient, getPublicClient } from './createClient'

import { TRPCError } from '@trpc/server'

export async function getServerClient() {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No session found' })
  }

  return getClient(session.accessToken)
}

export async function getPublicServerClient() {
  return getPublicClient()
}
