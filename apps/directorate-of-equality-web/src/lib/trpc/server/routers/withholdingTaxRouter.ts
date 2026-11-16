import { zGetWithholdingTaxJobCountsPath } from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * The temporary "Skatturinn" test page, for trying Skatturinn's job-count
 * feed before anything consumes it. doe-api enforces the ADMIN role.
 */
export const withholdingTaxRouter = router({
  check: protectedProcedure.mutation(({ ctx }) =>
    ctx.api.checkWithholdingTax(),
  ),

  getJobCounts: protectedProcedure
    .input(zGetWithholdingTaxJobCountsPath)
    .query(({ ctx, input }) =>
      ctx.api.getWithholdingTaxJobCounts({
        path: { incomeYear: input.incomeYear },
      }),
    ),
})
