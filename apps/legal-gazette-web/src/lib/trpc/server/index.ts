import { cache } from 'react'

import { AdvertApi } from '../../../gen/fetch'
import { getServerClient } from '../../api/serverClient'

import { initTRPC, TRPCError } from '@trpc/server'

let advertApi: AdvertApi | null = null

export const createTRPCContext = cache(async () => {
  const client = (advertApi ??= await getServerClient('AdvertApi'))
  return {
    advertApi: client,
  }
})

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter(opts) {
    const { shape, error } = opts

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

// Public procedures should always have client available
export const publicProcedure = t.procedure.use(({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
    },
  })
})

// Protected procedures should always have session available
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.advertApi) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Type assertion is safe here because we know that the user is set
  return next({
    ctx: {
      ...ctx,
      advertApi: ctx.advertApi,
    },
  })
})
