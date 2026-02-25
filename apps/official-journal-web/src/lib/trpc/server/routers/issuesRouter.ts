import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

const getMonthlyIssuesInput = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  departmentId: z.uuid().optional(),
  month: z.number().optional(),
  year: z.number().optional(),
})

const generateMonthlyIssusesInput = z.object({
  date: z.coerce.date(),
  departmentId: z.uuid(),
})

export const issuesRouter = router({
  getMonthlyIssues: protectedProcedure
    .input(getMonthlyIssuesInput)
    .query(async ({ ctx, input }) => ctx.api.getMonthlyIssues(input)),
  generateMonthlyIssues: protectedProcedure
    .input(generateMonthlyIssusesInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.api.generateMonthlyIssues(input)
    }),
})
