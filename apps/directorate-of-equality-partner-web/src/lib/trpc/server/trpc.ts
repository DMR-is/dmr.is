import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { bindSdk } from '@dmr.is/trpc/utils/bindSdk'
import { apiErrorMiddleware } from '@dmr.is/trpc/utils/errorHandler'

import * as doeApiSdk from '../../../gen/fetch/sdk.gen'
import { getServerClient } from '../../api/serverClient'
import { authOptions } from '../../auth/authOptions'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.accessToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No session found',
    })
  }

  const client = await getServerClient(session.accessToken)

  return {
    api: bindSdk(client, doeApiSdk),
    companyNationalId: session.user.companyNationalId,
    actor: session.user.actor,
  }
})

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter(opts) {
    const { shape, error } = opts
    const cause = error.cause as
      | { name?: string; details?: string[]; translatedMessage?: string }
      | undefined

    return {
      ...shape,
      message: shape.message,
      data: {
        ...shape.data,
        apiErrorName: cause?.name,
        validationErrors: cause?.details,
        translatedMessage: cause?.translatedMessage,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const mergeRouters = t.mergeRouters

export const protectedProcedure = t.procedure.use(apiErrorMiddleware)
