import { protectedProcedure, router } from '../trpc'
import { nullOnNotFound } from './nullOnNotFound'

export const companyRouter = router({
  /**
   * The signed-in company's register entry, or `null` when the register has
   * none. Consent and company keys both need the row, so `null` is what hides
   * them; an approved provider that is not itself an employer still gets its
   * own screens.
   */
  get: protectedProcedure.query(({ ctx }) =>
    nullOnNotFound(() => ctx.api.getApplicationCompany()),
  ),
})
