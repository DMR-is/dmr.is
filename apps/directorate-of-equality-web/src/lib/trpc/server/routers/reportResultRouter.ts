import { z } from 'zod'

import { getReportResultByReportId } from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

export const reportResultRouter = router({
  getByReportId: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiCall(getReportResultByReportId({ client: ctx.client, path: { reportId: input.reportId } }))
    }),
})
