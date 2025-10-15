import { cache } from 'react'

import { getServerClient } from '../../api/serverClient'
import { makeQueryClient } from '../client/query-client'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  return {
    api: await getServerClient(),
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
  return next({
    ctx: {
      ...ctx,
    },
  })
})

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
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

export const getQueryClient = cache(makeQueryClient)
