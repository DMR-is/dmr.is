import { z } from 'zod'

import {
  zGetCompanyEmailPath,
  zPresignCompanyEmailAttachmentBody,
  zSendCompanyEmailBody,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const companyEmailRouter = router({
  // Staging target for one attachment. The bytes go straight to S3 over the
  // returned presigned URL, never through tRPC — same route the register import
  // takes, and for the same reason.
  presignAttachment: protectedProcedure
    .input(zPresignCompanyEmailAttachmentBody)
    .mutation(({ ctx, input }) =>
      ctx.api.presignCompanyEmailAttachment({ body: input }),
    ),

  // A mutation despite reading nothing, because it takes a POST body — the same
  // shape `company.importPreview` has. Returns both who will receive the message
  // and who is excluded, with the reason.
  preview: protectedProcedure
    .input(zSendCompanyEmailBody)
    .mutation(({ ctx, input }) => ctx.api.previewCompanyEmail({ body: input })),

  // ⚠️ Resolves and returns 202 before anything is delivered; the API sends in
  // the background. The counts describe what was queued, so the UI must say
  // "queued", not "sent".
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
