import { z } from 'zod'

import { protectedProcedure, router } from '..'

import { inferRouterOutputs } from '@trpc/server'

export const advertsRouter = router({
  getAdvertsInProgress: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
        categoryId: z.array(z.string()).optional(),
        typeId: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, categoryId, typeId } = input
      const data = await ctx.advertApi.getAdverts({
        page,
        pageSize,
        categoryId,
        typeId,
      })
      console.log(data)
      return data
    }),
  getCompletedAdverts: protectedProcedure
    .input(
      z.object({
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input
      const data = await ctx.advertApi.getCompletedAdverts({ page, pageSize })
      console.log('completed', data)
      return data
    }),
})


export type infertRouterOutputs = inferRouterOutputs<typeof advertsRouter>
export type GetCompletedAdvertsOutput = infertRouterOutputs['getCompletedAdverts']

