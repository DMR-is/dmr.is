import * as z from 'zod'

import { getLogger } from '@dmr.is/logging-next'
import { withDefault } from '@dmr.is/trpc/utils/apiHelpers'

import { protectedProcedure, router } from '../trpc'

const getCategoriesSchema = z.object({
  type: z.uuid().optional(),
})
const logger = getLogger('baseEntityRouter')

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
        withDefault(ctx.api.getTypes({}), { types: [] }, logger, 'fetch types'),
        withDefault(
          ctx.api.getCategories({}),
          { categories: [] },
          logger,
          'fetch categories',
        ),
        withDefault(
          ctx.api.getStatuses(),
          { statuses: [] },
          logger,
          'fetch statuses',
        ),
        withDefault(
          ctx.api.getCourtDistricts(),
          { courtDistricts: [] },
          logger,
          'fetch court districts',
        ),
      ])
    return { types, categories, statuses, courtDistricts }
  }),
})
