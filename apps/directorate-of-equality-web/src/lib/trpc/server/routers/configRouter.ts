import {
  zGetConfigByKeyPath,
  zGetConfigHistoryByKeyPath,
  zUpdateConfigByKeyBody,
  zUpdateConfigByKeyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const configRouter = router({
  getAll: protectedProcedure.query(({ ctx }) => ctx.api.getAllConfig()),

  getByKey: protectedProcedure
    .input(zGetConfigByKeyPath)
    .query(({ ctx, input }) =>
      ctx.api.getConfigByKey({
        path: { key: input.key },
      }),
    ),

  updateByKey: protectedProcedure
    .input(zUpdateConfigByKeyPath.extend(zUpdateConfigByKeyBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.updateConfigByKey({
        path: { key: input.key },
        body: { value: input.value, description: input.description },
      }),
    ),

  getHistoryByKey: protectedProcedure
    .input(zGetConfigHistoryByKeyPath)
    .query(({ ctx, input }) =>
      ctx.api.getConfigHistoryByKey({
        path: { key: input.key },
      }),
    ),
})
