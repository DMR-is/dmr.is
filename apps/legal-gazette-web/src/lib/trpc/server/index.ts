import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { authOptions } from '../../auth/authOptions'

import { initTRPC, TRPCError } from '@trpc/server'

export const createTRPCContext = cache(
  async (opts: { cookies: ReadonlyRequestCookies }) => {
    const session = await getServerSession(authOptions)

    return {
      session: session,
    }
  },
)

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
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Type assertion is safe here because we know that the user is set
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})
