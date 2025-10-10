import { z } from 'zod'

import { StatusIdEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertsRequestSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.array(z.string()).optional(),
  statusId: z.array(z.enum(StatusIdEnum)).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export const advertsRouter = router({
  getAdvertsCount: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.advertsApi.getAdvertsCount()
  }),
  getSubmittedAdverts: protectedProcedure.input(getAdvertsRequestSchema).query(
    async ({ ctx, input }) =>
      await ctx.advertsApi.getAdverts({
        ...input,
        statusId: [StatusIdEnum.SUBMITTED],
      }),
  ),
  getReadyForPublicationAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.advertsApi.getAdverts({
          ...input,
          statusId: [StatusIdEnum.READY_FOR_PUBLICATION],
        }),
    ),
  getCompletedAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => await ctx.advertsApi.getAdverts(input)),
})
