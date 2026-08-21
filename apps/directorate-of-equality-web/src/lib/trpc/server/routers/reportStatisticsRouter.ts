import {
  zGetBenefitsBreakdownPath,
  zGetRegularHourlyWageByScoreAllPath,
  zGetRegularHourlyWageByScoreWorkPath,
  zGetRegularHourlyWageGenderWageGapPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * Four procedures, not six. The API used to expose a base/full pair for each
 * chart — `baseSalary / workRatio` alongside the total-pay variant — and both
 * were coherent while the divisor normalised to a full-time equivalent. Under an
 * **hours** denominator only the total-pay numerator is: dividing base pay alone
 * by hours that include the overtime which earned the additional and bonus pay
 * is arithmetically incoherent. So the pair collapsed to one, and the surviving
 * procedures dropped the meaningless "base"/"full" qualifier.
 */
export const reportStatisticsRouter = router({
  regularHourlyWageByScoreAll: protectedProcedure
    .input(zGetRegularHourlyWageByScoreAllPath)
    .query(({ ctx, input }) =>
      ctx.api.getRegularHourlyWageByScoreAll({
        path: { reportId: input.reportId },
      }),
    ),

  regularHourlyWageByScoreWork: protectedProcedure
    .input(zGetRegularHourlyWageByScoreWorkPath)
    .query(({ ctx, input }) =>
      ctx.api.getRegularHourlyWageByScoreWork({
        path: { reportId: input.reportId },
      }),
    ),

  regularHourlyWageGenderWageGap: protectedProcedure
    .input(zGetRegularHourlyWageGenderWageGapPath)
    .query(({ ctx, input }) =>
      ctx.api.getRegularHourlyWageGenderWageGap({
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
