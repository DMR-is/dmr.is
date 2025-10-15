import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getCategoriesSchema = z
  .object({
    type: z.string().optional(),
  })
  .optional()

export const baseEntityRouter = router({
  getTypes: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.api.getTypes()
  }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ ctx, input = {} }) => {
      return await ctx.api.getCategories(input)
    }),
})
