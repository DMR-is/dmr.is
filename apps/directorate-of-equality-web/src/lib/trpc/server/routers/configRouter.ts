import { z } from 'zod'

import {
  getAllConfig,
  getConfigByKey,
  getConfigHistoryByKey,
  updateConfigByKey,
} from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

export const configRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return apiCall(getAllConfig({ client: ctx.client }))
  }),

  getByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiCall(
        getConfigByKey({ client: ctx.client, path: { key: input.key } }),
      )
    }),

  updateByKey: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiCall(
        updateConfigByKey({
          client: ctx.client,
          path: { key: input.key },
          body: { value: input.value, description: input.description },
        }),
      )
    }),

  getHistoryByKey: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiCall(
        getConfigHistoryByKey({ client: ctx.client, path: { key: input.key } }),
      )
    }),
})
