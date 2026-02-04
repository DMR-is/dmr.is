import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { apiErrorMiddleware } from '@dmr.is/trpc/utils/errorHandler'

import { getServerClient } from '../../api/serverClient'
import { authOptions } from '../../auth/authOptions'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    console.log('----------')
    console.log('Somehow, we are not getting session here', session)
    console.log('----------')
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No session found',
    })
  }

  return {
    api: await getServerClient(session.idToken),
  }
})

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter(opts) {
    const { shape, error } = opts
    const cause = error.cause as
      | { name?: string; details?: string[] }
      | undefined

    return {
      ...shape,
      message: shape.message,
      data: {
        ...shape.data,
        apiErrorName: cause?.name,
        validationErrors: cause?.details,
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
