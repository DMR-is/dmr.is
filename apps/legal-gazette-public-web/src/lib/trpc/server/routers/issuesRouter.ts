import z from 'zod'

import { publicProcedure, router } from '../trpc'

const getIssuesSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  year: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})
export const issuesRouter = router({
  getIssues: publicProcedure
    .input(getIssuesSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.publicApi.getAllPublishedIssues(input)
    }),
})
