import { getServerSession } from 'next-auth'

import { AppRouter } from '../../server/routers/_app'
import { authOptions } from '../auth/authOptions'

import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'

function getBaseUrl() {
  if (typeof window !== 'undefined') return '' // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // SSR should use vercel url
  return `http://localhost:${process.env.LG_WEB_PORT ?? 4202}` // dev SSR should use localhost
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          async headers() {
            const session = await getServerSession(authOptions)
            return {
              authorization: `Bearer ${session?.idToken}`,
            }
          },
        }),
      ],
    }
  },
  ssr: false,
})
