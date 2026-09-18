import {
  zGetCompanyApiKeysPath,
  zIssueCompanyApiKeyBody,
  zIssueCompanyApiKeyPath,
  zRevokeCompanyApiKeyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/**
 * Admin key administration for one company.
 *
 * `issue` returns the plaintext secret and it is the only place that ever will —
 * the API stores a hash. So the response must reach the screen that shows it
 * once and go no further: it is not cached, and no query re-reads it.
 */
export const apiKeyRouter = router({
  listForCompany: protectedProcedure
    .input(zGetCompanyApiKeysPath)
    .query(({ ctx, input }) =>
      ctx.api.getCompanyApiKeys({
        path: { companyId: input.companyId },
      }),
    ),

  issue: protectedProcedure
    .input(zIssueCompanyApiKeyPath.extend(zIssueCompanyApiKeyBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.issueCompanyApiKey({
        path: { companyId: input.companyId },
        body: {
          label: input.label,
          scopes: input.scopes,
          expiresAt: input.expiresAt,
        },
      }),
    ),

  revoke: protectedProcedure
    .input(zRevokeCompanyApiKeyPath)
    .mutation(({ ctx, input }) =>
      ctx.api.revokeCompanyApiKey({
        path: { companyId: input.companyId, id: input.id },
      }),
    ),
})
