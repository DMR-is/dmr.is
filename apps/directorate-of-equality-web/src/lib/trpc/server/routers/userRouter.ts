import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getMyUser: protectedProcedure.query(({ ctx }) => ctx.api.getMyUser()),
  list: protectedProcedure
    .input(z.object({ showInactive: z.boolean().optional() }).optional())
    .query(({ ctx, input }) =>
      ctx.api.getUsers({ query: { showInactive: input?.showInactive } }),
    ),
})
