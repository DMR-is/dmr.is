import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getCategoriesSchema = z.object({
  type: z.uuid(),
})

export const baseEntityRouter = router({
  getTypes: protectedProcedure
    .input(z.object({ excludeUnassignable: z.boolean().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.api.getTypes({
        excludeUnassignable: input?.excludeUnassignable,
      })
    }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ input, ctx }) => {
      return ctx.api.getCategories(input)
    }),
  getStatuses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getStatuses()
  }),
  getCourtDistricts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getCourtDistricts()
  }),
  getAllEntities: protectedProcedure.query(async ({ ctx }) => {
    const [{ types }, { categories }, { statuses }, { courtDistricts }] =
      await Promise.all([
        ctx.api.getTypes({}),
        ctx.api.getCategories({}),
        ctx.api.getStatuses(),
        ctx.api.getCourtDistricts(),
      ])
    return { types, categories, statuses, courtDistricts }
  }),
})
