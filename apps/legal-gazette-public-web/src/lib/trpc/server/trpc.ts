import { cache } from 'react'

import { getPublicServerClient, getServerClient } from '../../api/serverClient'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  return {
    publicApi: await getPublicServerClient(),
  }
})

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter(opts) {
    const { shape } = opts

    return {
      ...shape,
      message: shape.message,
      data: {
        ...shape.data,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory
export const router = t.router
export const mergeRouters = t.mergeRouters

export const publicProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.publicApi) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'No public API client found',
    })
  }
  return next({
    ctx: {
      ...ctx,
      publicApi: ctx.publicApi,
    },
  })
})

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  try {
    const api = await getServerClient()

    return next({
      ctx: {
        ...ctx,
        api,
      },
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'No session found') {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: e.message })
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    })
  }
})
