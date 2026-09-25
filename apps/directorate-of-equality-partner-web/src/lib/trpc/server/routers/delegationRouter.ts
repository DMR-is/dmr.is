import {
  zGrantApplicationPartnerDelegationBody,
  zRevokeApplicationPartnerDelegationPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * Consent: which approved providers may file for the signed-in company.
 *
 * There is no company in any input. The API resolves it from the access token,
 * so a request cannot name someone else's company, and the person granting is
 * recorded from the token as well.
 */
export const delegationRouter = router({
  listProviders: protectedProcedure.query(({ ctx }) =>
    ctx.api.getApplicationPartnerProviders(),
  ),

  list: protectedProcedure.query(({ ctx }) =>
    ctx.api.getApplicationPartnerDelegations(),
  ),

  grant: protectedProcedure
    .input(zGrantApplicationPartnerDelegationBody)
    .mutation(({ ctx, input }) =>
      ctx.api.grantApplicationPartnerDelegation({ body: input }),
    ),

  revoke: protectedProcedure
    .input(zRevokeApplicationPartnerDelegationPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokeApplicationPartnerDelegation({ path: { id: input.id } }),
    ),
})
