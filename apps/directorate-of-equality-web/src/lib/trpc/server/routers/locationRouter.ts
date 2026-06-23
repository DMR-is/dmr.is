import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

const zGetPostcodesQuery = z.object({
  regionCode: z.array(z.string()).optional(),
})

export const locationRouter = router({
  regions: protectedProcedure.query(({ ctx }) => ctx.api.getRegions()),

  // Optionally narrowed to the given regions — this is what lets the company
  // filter shrink the postcode options once a region is picked.
  postcodes: protectedProcedure
    .input(zGetPostcodesQuery.optional())
    .query(({ ctx, input }) =>
      ctx.api.getPostcodes({ query: input as never }),
    ),
})
