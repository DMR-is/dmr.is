import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getMyUser: protectedProcedure.query(({ ctx }) => ctx.api.getMyUser()),
  listActive: protectedProcedure.query(({ ctx }) => ctx.api.getActiveUsers()),
})
