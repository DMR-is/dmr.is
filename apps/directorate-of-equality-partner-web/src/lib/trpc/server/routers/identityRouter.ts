import { protectedProcedure, router } from '../trpc'

/**
 * Who is signed in, read off the session rather than asked of the API: the
 * acting person under a procuration login is an id-token claim, and the API
 * only ever sees the company.
 */
export const identityRouter = router({
  get: protectedProcedure.query(({ ctx }) => ({
    companyNationalId: ctx.companyNationalId ?? null,
    actor: ctx.actor ?? null,
  })),
})
