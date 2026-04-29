import { z } from 'zod'

import {
  getBaseSalaryByGenderAndScoreAll,
  getBaseSalaryByGenderAndScoreWork,
  getBaseSalaryGenderWageGap,
  getBenefitsBreakdown,
  getFullSalaryByGenderAndScoreAll,
  getFullSalaryGenderWageGap,
} from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

const reportIdInput = z.object({ reportId: z.string() })

export const reportStatisticsRouter = router({
  baseSalaryByGenderAndScoreAll: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getBaseSalaryByGenderAndScoreAll({ client: ctx.client, path: input }))
    }),

  baseSalaryByGenderAndScoreWork: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getBaseSalaryByGenderAndScoreWork({ client: ctx.client, path: input }))
    }),

  fullSalaryByGenderAndScoreAll: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getFullSalaryByGenderAndScoreAll({ client: ctx.client, path: input }))
    }),

  baseSalaryGenderWageGap: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getBaseSalaryGenderWageGap({ client: ctx.client, path: input }))
    }),

  fullSalaryGenderWageGap: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getFullSalaryGenderWageGap({ client: ctx.client, path: input }))
    }),

  benefitsBreakdown: protectedProcedure
    .input(reportIdInput)
    .query(async ({ ctx, input }) => {
      return apiCall(getBenefitsBreakdown({ client: ctx.client, path: input }))
    }),
})
