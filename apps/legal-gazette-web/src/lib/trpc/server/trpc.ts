import { cache } from 'react'

import { getServerClient } from '../../api/serverClient'
import { makeQueryClient } from '../client/query-client'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  return {
    adverts: {
      baseApi: await getServerClient('AdvertApi'),
      updateApi: await getServerClient('AdvertUpdateApi'),
    },
    baseEntity: {
      typeApi: await getServerClient('TypeApi'),
      categoryApi: await getServerClient('CategoryApi'),
      statusApi: await getServerClient('StatusApi'),
      courtDistrictApi: await getServerClient('CourtDistrictApi'),
    },
    usersApi: await getServerClient('UsersApi'),
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
  if (!ctx.adverts.baseApi) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (!ctx.adverts.updateApi) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (
    !ctx.baseEntity.categoryApi ||
    !ctx.baseEntity.typeApi ||
    !ctx.baseEntity.statusApi ||
    !ctx.baseEntity.courtDistrictApi
  ) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Type assertion is safe here because we know that the user is set
  return next({
    ctx: {
      ...ctx,
      advertsApi: ctx.adverts.baseApi,
      updateApi: ctx.adverts.updateApi,
      baseEntity: {
        typeApi: ctx.baseEntity.typeApi,
        categoryApi: ctx.baseEntity.categoryApi,
        statusApi: ctx.baseEntity.statusApi,
        courtDistrictApi: ctx.baseEntity.courtDistrictApi,
      },
    },
  })
})

export const getQueryClient = cache(makeQueryClient)
