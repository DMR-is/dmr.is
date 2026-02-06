import * as z from 'zod'

import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({ publicationId: z.string() })

export const publicationRouter = router({
  getAdvertPublication: protectedProcedure
    .input(getAdvertPublicationSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.getAdvertPublication({
        publicationId: input.publicationId,
      })
    }),
})
