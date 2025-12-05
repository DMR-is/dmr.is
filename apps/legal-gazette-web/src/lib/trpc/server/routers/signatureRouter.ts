import z from 'zod'

import { protectedProcedure, router } from '../trpc'

const updateSignatureInput = z.object({
  signatureId: z.string(),
  advertId: z.string(),
  name: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  onBehalfOf: z.string().optional().nullable(),
})

export const signatureRouter = router({
  updateSignature: protectedProcedure
    .input(updateSignatureInput)
    .mutation(async ({ input, ctx }) => {
      const { signatureId, advertId, ...updateData } = input
      return await ctx.signatureApi.updateSignature({
        signatureId: signatureId,
        advertId: advertId,
        updateSignatureDto: updateData,
      })
    }),
})
