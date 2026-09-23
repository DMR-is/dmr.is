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
  if (session?.invalid || !session?.idToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No session found',
    })
  }

  const client = await getServerClient(session.idToken)

  return {
    api: bindSdk(client, doeApiSdk),
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
        // `shape.message` is the API's English developer message. Error-message
        // files ship a curated Icelandic string alongside it, which the HTTP
        // filter puts on `translatedMessage`; forward it so UI callers can show
        // it instead of leaking English into an Icelandic screen.
        translatedMessage: cause?.translatedMessage,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const mergeRouters = t.mergeRouters

export const publicProcedure = t.procedure.use(({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
    },
  })
})

export const protectedProcedure = publicProcedure
  .use(({ ctx, next }) => {
    if (!ctx.api) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return next({
      ctx: {
        ...ctx,
        api: ctx.api,
      },
    })
  })
  .use(apiErrorMiddleware)
