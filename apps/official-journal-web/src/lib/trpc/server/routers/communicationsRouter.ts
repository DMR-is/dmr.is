import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const communicationsRouter = router({
  getCommunicationStatuses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getCommunicationStatuses()
  }),

  createCommunicationChannel: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.createCommunicationChannel({
        caseId: input.caseId,
        createCaseChannelBody: {
          name: input.name,
          email: input.email,
          phone: input.phone,
        },
      })
    }),

  deleteCommunicationChannel: protectedProcedure
    .input(z.object({ caseId: z.string(), channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.api.deleteCommunicationChannel({
        caseId: input.caseId,
        channelId: input.channelId,
      })
    }),
})
