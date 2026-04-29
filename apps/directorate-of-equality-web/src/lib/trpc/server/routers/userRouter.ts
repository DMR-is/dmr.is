import { getMyUser } from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

export const userRouter = router({
  getMyUser: protectedProcedure.query(async ({ ctx }) => {
    return apiCall(getMyUser({ client: ctx.client }))
  }),
})
