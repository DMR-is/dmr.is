import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getMyUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getMyUser()
  }),
})
