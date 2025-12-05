import { protectedProcedure, router } from '../trpc'

export const usersRouter = router({
  getEmployees: protectedProcedure.query(async ({ ctx }) => {
    return ctx.api.getEmployees()
  }),
})
