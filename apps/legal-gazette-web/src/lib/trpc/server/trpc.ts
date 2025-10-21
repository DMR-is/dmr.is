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
    publications: {
      publicationsApi: await getServerClient('AdvertPublicationApi'),
      advertPublishApi: await getServerClient('AdvertPublishApi'),
    },
    usersApi: await getServerClient('UsersApi'),
    settlementApi: await getServerClient('SettlementApi'),
    commentsApi: await getServerClient('CommentApi'),
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

const validateApiAccess = (
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
) => {
  const requiredApis = [
    ctx.adverts.baseApi,
    ctx.adverts.updateApi,
    ctx.baseEntity.categoryApi,
    ctx.baseEntity.typeApi,
    ctx.baseEntity.statusApi,
    ctx.baseEntity.courtDistrictApi,
    ctx.publications.publicationsApi,
    ctx.commentsApi,
  ]

  if (requiredApis.some((api) => !api)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
}

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  validateApiAccess(ctx)

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
      publications: {
        publicationsApi: ctx.publications.publicationsApi,
        advertPublishApi: ctx.publications.advertPublishApi,
      },
      usersApi: ctx.usersApi,
      settlementApi: ctx.settlementApi,
      commentsApi: ctx.commentsApi,
    },
  })
})

export const getQueryClient = cache(makeQueryClient)
