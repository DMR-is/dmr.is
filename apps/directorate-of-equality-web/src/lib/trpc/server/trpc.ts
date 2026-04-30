import { getServerSession } from 'next-auth'

import { cache } from 'react'

import { apiErrorMiddleware } from '@dmr.is/trpc/utils/errorHandler'

import type { Client } from '../../../gen/fetch/client'
import * as doeApiSdk from '../../../gen/fetch/sdk.gen'
import { getServerClient } from '../../api/serverClient'
import { authOptions } from '../../auth/authOptions'

import { initTRPC, TRPCError } from '@trpc/server'

type SdkFunction = (...args: any[]) => any

type DataResponse<T> =
  T extends Promise<infer TResult>
    ? TResult extends { data: infer TData }
      ? Promise<Exclude<TData, undefined>>
      : Promise<TResult>
    : T

type BoundSdkOptions<T> = Omit<T, 'client' | 'responseStyle' | 'throwOnError'>

type BoundSdkFn<T extends SdkFunction> =
  Parameters<T> extends []
    ? () => DataResponse<ReturnType<T>>
    : undefined extends Parameters<T>[0]
      ? (
          options?: BoundSdkOptions<NonNullable<Parameters<T>[0]>>,
        ) => DataResponse<ReturnType<T>>
      : (
          options: BoundSdkOptions<Parameters<T>[0]>,
        ) => DataResponse<ReturnType<T>>

type BoundSdk<T extends Record<string, SdkFunction>> = {
  [K in keyof T]: BoundSdkFn<T[K]>
}

function bindSdk<T extends Record<string, SdkFunction>>(
  client: Client,
  sdk: T,
): BoundSdk<T> {
  return Object.fromEntries(
    Object.entries(sdk).map(([key, fn]) => [
      key,
      async (options?: unknown) =>
        fn(
          options === undefined
            ? { client, responseStyle: 'data', throwOnError: true }
            : {
                ...options,
                client,
                responseStyle: 'data',
                throwOnError: true,
              },
        ),
    ]),
  ) as BoundSdk<T>
}

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
