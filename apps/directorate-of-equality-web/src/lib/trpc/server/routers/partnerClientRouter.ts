import {
  zCreatePartnerClientBody,
  zGetPartnerClientKeysPath,
  zIssuePartnerClientKeyBody,
  zIssuePartnerClientKeyPath,
  zRevokePartnerClientKeyPath,
  zRevokePartnerClientPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * Vendor client administration — the accounting firms approved to file for the
 * companies that delegate to them.
 *
 * `issueKey` returns the plaintext secret and it is the only place that ever
 * will: the API stores a hash. As with company keys, the response must reach
 * the screen that shows it once and go no further.
 */
export const partnerClientRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.api.getPartnerClients()),

  create: protectedProcedure
    .input(zCreatePartnerClientBody)
    .mutation(({ ctx, input }) => ctx.api.createPartnerClient({ body: input })),

  revoke: protectedProcedure
    .input(zRevokePartnerClientPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokePartnerClient({ path: { id: input.id } }),
    ),

  listKeys: protectedProcedure
    .input(zGetPartnerClientKeysPath)
    .query(({ ctx, input }) =>
      ctx.api.getPartnerClientKeys({ path: { id: input.id } }),
    ),

  issueKey: protectedProcedure
    .input(zIssuePartnerClientKeyPath.extend(zIssuePartnerClientKeyBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.issuePartnerClientKey({
        path: { id: input.id },
        body: { label: input.label, expiresAt: input.expiresAt },
      }),
    ),

  revokeKey: protectedProcedure
    .input(zRevokePartnerClientKeyPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokePartnerClientKey({
        path: { id: input.id, keyId: input.keyId },
      }),
    ),
})
