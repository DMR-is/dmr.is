import { z } from 'zod'

import { StatusIdEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '..'

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
  getAdvertsInProgress: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => {
      console.log('input', input)
      const data = await ctx.advertApi.getAdvertsInProgress(input)

      data.adverts.map((ad) => console.log(ad.status.title))
      return data
    }),
  getCompletedAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(
      async ({ ctx, input }) => await ctx.advertApi.getCompletedAdverts(input),
    ),
})
