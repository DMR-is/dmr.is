import * as z from 'zod'

import { AdvertVersionEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertPublicationSchema = z.object({
  advertId: z.uuid(),
  version: z.enum(AdvertVersionEnum),
})

export const publicationRouter = router({
  getAdvertPublication: protectedProcedure
    .input(getAdvertPublicationSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.api.getAdvertPublication(input)
    }),
})
