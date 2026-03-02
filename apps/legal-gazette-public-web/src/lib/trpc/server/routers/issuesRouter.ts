import * as z from 'zod'

import { publicProcedure, router } from '../trpc'

const getIssuesSchema = z.object({
  page: z.coerce.number().int().optional(),
  pageSize: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})
export const issuesRouter = router({
  getIssues: publicProcedure
    .input(getIssuesSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.publicApi.getAllPublishedIssues(input)
    }),
})
