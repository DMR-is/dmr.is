import {
  zIssueApplicationPartnerClientKeyBody,
  zRevokeApplicationPartnerClientKeyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'
import { nullOnNotFound } from './nullOnNotFound'

/**
 * An approved provider managing its own vendor keys (`doev_…`), signed in as
 * itself. The provider is resolved from the token by the API, never from input.
 *
 * `issueKey` carries the plaintext secret, with the same one-screen rule as
 * company keys.
 */
export const partnerClientRouter = router({
  /** `null` for anyone who is not an approved provider. */
  get: protectedProcedure.query(({ ctx }) =>
    nullOnNotFound(() => ctx.api.getApplicationPartnerClient()),
  ),

  listKeys: protectedProcedure.query(({ ctx }) =>
    ctx.api.getApplicationPartnerClientKeys(),
  ),

  issueKey: protectedProcedure
    .input(zIssueApplicationPartnerClientKeyBody)
    .mutation(({ ctx, input }) =>
      ctx.api.issueApplicationPartnerClientKey({
        body: { label: input.label, expiresAt: input.expiresAt },
      }),
    ),

  revokeKey: protectedProcedure
    .input(zRevokeApplicationPartnerClientKeyPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokeApplicationPartnerClientKey({ path: { id: input.id } }),
    ),
})
