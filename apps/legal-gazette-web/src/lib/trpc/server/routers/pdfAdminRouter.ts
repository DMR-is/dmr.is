import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const regeneratePdfInput = z.object({
  advertId: z.string().uuid(),
  publicationId: z.string().uuid(),
})

export const pdfAdminRouter = router({
  regeneratePdf: protectedProcedure
    .input(regeneratePdfInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.api.regeneratePublicationPdf({
        advertId: input.advertId,
        publicationId: input.publicationId,
      })
    }),
})
