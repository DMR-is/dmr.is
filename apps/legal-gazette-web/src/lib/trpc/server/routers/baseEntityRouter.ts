import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getCategoriesSchema = z.object({
  type: z.uuid(),
})

export const baseEntityRouter = router({
  getTypes: protectedProcedure
    .input(z.object({ excludeUnassignable: z.boolean().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.baseEntity.typeApi.getTypes({
        excludeUnassignable: input?.excludeUnassignable,
      })
    }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ input, ctx }) => {
      return ctx.baseEntity.categoryApi.getCategories(input)
    }),
  getStatuses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.baseEntity.statusApi.getStatuses()
  }),
  getCourtDistricts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.baseEntity.courtDistrictApi.getCourtDistricts()
  }),
  getAllEntities: protectedProcedure.query(async ({ ctx }) => {
    const [{ types }, { categories }, { statuses }, { courtDistricts }] =
      await Promise.all([
        ctx.baseEntity.typeApi.getTypes({}),
        ctx.baseEntity.categoryApi.getCategories({}),
        ctx.baseEntity.statusApi.getStatuses(),
        ctx.baseEntity.courtDistrictApi.getCourtDistricts(),
      ])
    return { types, categories, statuses, courtDistricts }
  }),
})
