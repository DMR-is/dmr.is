import z from 'zod'

import { GetAdvertPublicationVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({
  advertId: z.uuid(),
  version: z.enum(GetAdvertPublicationVersionEnum),
})

export const publicationRouter = router({
  getAdvertPublication: protectedProcedure
    .input(getAdvertPublicationSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.getAdvertPublication(input)
    }),
})
