import {
  zGetBaseSalaryByGenderAndScoreAllPath,
  zGetBaseSalaryByGenderAndScoreWorkPath,
  zGetBaseSalaryGenderWageGapPath,
  zGetBenefitsBreakdownPath,
  zGetFullSalaryByGenderAndScoreAllPath,
  zGetFullSalaryGenderWageGapPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const reportStatisticsRouter = router({
  baseSalaryByGenderAndScoreAll: protectedProcedure
    .input(zGetBaseSalaryByGenderAndScoreAllPath)
    .query(({ ctx, input }) =>
      ctx.api.getBaseSalaryByGenderAndScoreAll({
        path: { reportId: input.reportId },
      }),
    ),

  baseSalaryByGenderAndScoreWork: protectedProcedure
    .input(zGetBaseSalaryByGenderAndScoreWorkPath)
    .query(({ ctx, input }) =>
      ctx.api.getBaseSalaryByGenderAndScoreWork({
        path: { reportId: input.reportId },
      }),
    ),

  fullSalaryByGenderAndScoreAll: protectedProcedure
    .input(zGetFullSalaryByGenderAndScoreAllPath)
    .query(({ ctx, input }) =>
      ctx.api.getFullSalaryByGenderAndScoreAll({
        path: { reportId: input.reportId },
      }),
    ),

  baseSalaryGenderWageGap: protectedProcedure
    .input(zGetBaseSalaryGenderWageGapPath)
    .query(({ ctx, input }) =>
      ctx.api.getBaseSalaryGenderWageGap({
        path: { reportId: input.reportId },
      }),
    ),

  fullSalaryGenderWageGap: protectedProcedure
    .input(zGetFullSalaryGenderWageGapPath)
    .query(({ ctx, input }) =>
      ctx.api.getFullSalaryGenderWageGap({
        path: { reportId: input.reportId },
      }),
    ),

  benefitsBreakdown: protectedProcedure
    .input(zGetBenefitsBreakdownPath)
    .query(({ ctx, input }) =>
      ctx.api.getBenefitsBreakdown({
        path: { reportId: input.reportId },
      }),
    ),
})
