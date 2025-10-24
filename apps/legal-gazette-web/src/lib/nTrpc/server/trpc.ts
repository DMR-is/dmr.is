import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { getServerClient } from '../../api/serverClient'
import { authOptions } from '../../auth/authOptions'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(async () => {
  const session = await getServerSession(authOptions)
  if (session?.invalid || !session?.idToken) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return {
    session,
    adverts: {
      baseApi: await getServerClient('AdvertApi', session.idToken),
      updateApi: await getServerClient('AdvertUpdateApi', session.idToken),
    },
    baseEntity: {
      typeApi: await getServerClient('TypeApi', session.idToken),
      categoryApi: await getServerClient('CategoryApi', session.idToken),
      statusApi: await getServerClient('StatusApi', session.idToken),
      courtDistrictApi: await getServerClient('CourtDistrictApi', session.idToken),
    },
    publications: {
      publicationsApi: await getServerClient('AdvertPublicationApi', session.idToken),
      advertPublishApi: await getServerClient('AdvertPublishApi', session.idToken),
    },
    usersApi: await getServerClient('UsersApi', session.idToken),
    settlementApi: await getServerClient('SettlementApi', session.idToken),
    commentsApi: await getServerClient('CommentApi', session.idToken),
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
