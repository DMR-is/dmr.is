import {
  zReconcileMailboxDeliveryBody,
  zReconcileMailboxDeliveryPath,
  zRetryNoticePath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

/** The admin "Tilkynningar" page. doe-api enforces the ADMIN role on every call. */
export const noticeIssuesRouter = router({
  getIssues: protectedProcedure.query(({ ctx }) => ctx.api.getNoticeIssues()),

  retryNotice: protectedProcedure
    .input(zRetryNoticePath)
    .mutation(({ ctx, input }) =>
      ctx.api.retryNotice({ path: { id: input.id } }),
    ),

  reconcileDelivery: protectedProcedure
    .input(
      zReconcileMailboxDeliveryPath.extend(zReconcileMailboxDeliveryBody.shape),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.reconcileMailboxDelivery({
        path: { id: input.id },
        body: { outcome: input.outcome, documentItemId: input.documentItemId },
      }),
    ),
})
