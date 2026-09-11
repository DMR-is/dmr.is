import { z } from 'zod'

import {
  zDiscardCompanyEmailAttachmentBody,
  zGetCompanyEmailPath,
  zPresignCompanyEmailAttachmentBody,
  zSendCompanyEmailBody,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const companyEmailRouter = router({
  // Staging target for one attachment. The bytes go straight to S3 over the
  // returned presigned URL, never through tRPC.
  presignAttachment: protectedProcedure
    .input(zPresignCompanyEmailAttachmentBody)
    .mutation(({ ctx, input }) =>
      ctx.api.presignCompanyEmailAttachment({ body: input }),
    ),

  // Deletes an attachment the admin removed, or cancelled the message with,
  // before it was sent. Best-effort — the staged object is the admin's own
  // upload, so a failure must not surface as an error.
  //
  // Never call this for an attachment already submitted with a batch: until
  // `archiveAttachments` has run, the staged object is that message's only copy.
  discardAttachment: protectedProcedure
    .input(zDiscardCompanyEmailAttachmentBody)
    .mutation(({ ctx, input }) =>
      ctx.api.discardCompanyEmailAttachment({ body: input }),
    ),

  // A mutation despite reading nothing, because it takes a POST body. Returns
  // both who will receive the message and who is excluded, with the reason.
  preview: protectedProcedure
    .input(zSendCompanyEmailBody)
    .mutation(({ ctx, input }) => ctx.api.previewCompanyEmail({ body: input })),

  // Resolves and returns 202 before anything is delivered; the API sends in the
  // background. The counts describe what was queued, so the UI says "queued".
  send: protectedProcedure
    .input(zSendCompanyEmailBody)
    .mutation(({ ctx, input }) => ctx.api.sendCompanyEmail({ body: input })),

  // Backs the timeline expanding a CUSTOM_EMAIL_* entry into what was sent.
  get: protectedProcedure
    .input(zGetCompanyEmailPath)
    .query(({ ctx, input }) =>
      ctx.api.getCompanyEmail({ path: { id: input.id } }),
    ),
})

/** Widen nothing here — the generated body schema is the contract. */
export type CompanyEmailInput = z.infer<typeof zSendCompanyEmailBody>
