import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getCategoriesSchema = z
  .object({
    type: z.string().optional(),
  })
  .optional()

const getTypesSchema = z
  .object({
    category: z.string().optional(),
  })
  .optional()

export const baseEntityRouter = router({
  getTypes: protectedProcedure
    .input(getTypesSchema)
    .query(async ({ ctx, input = {} }) => {
      return await ctx.api.getTypes(input)
    }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ ctx, input = {} }) => {
      return await ctx.api.getCategories(input)
    }),
})
