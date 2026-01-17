import { getBaseUrlFromServerSide } from '../../../utils'
import {  publicProcedure, router } from '../trpc'

export const environmentRouter = router({
  getMyBaseUrl: publicProcedure.query(async () => {
    return getBaseUrlFromServerSide()
  }),
})
