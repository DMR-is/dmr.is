import {
  zIssueApplicationApiKeyBody,
  zRevokeApplicationApiKeyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * The signed-in company's own keys, for filing directly rather than through a
 * provider.
 *
 * `issue` returns the plaintext secret and it is the only place that ever will
 * — the API stores a hash. The response must reach the screen that shows it
 * once and go no further: it is not cached, and no query re-reads it.
 */
export const apiKeyRouter = router({
  list: protectedProcedure.query(({ ctx }) => ctx.api.getApplicationApiKeys()),

  issue: protectedProcedure
    .input(zIssueApplicationApiKeyBody)
    .mutation(({ ctx, input }) =>
      ctx.api.issueApplicationApiKey({
        body: {
          label: input.label,
          scopes: input.scopes,
          expiresAt: input.expiresAt,
        },
      }),
    ),

  revoke: protectedProcedure
    .input(zRevokeApplicationApiKeyPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokeApplicationApiKey({ path: { id: input.id } }),
    ),
})
