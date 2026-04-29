import { z } from 'zod'

import { ReportSortByEnum, ReportStatusEnum, ReportTypeEnum, SortDirectionEnum } from '../../../../gen/fetch'
import { getReportById, listReports } from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

const listReportsInput = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  type: z.array(z.nativeEnum(ReportTypeEnum)).optional(),
  status: z.array(z.nativeEnum(ReportStatusEnum)).optional(),
  reviewerUserId: z.array(z.string()).optional(),
  unassignedReviewer: z.boolean().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  approvedFrom: z.string().optional(),
  approvedTo: z.string().optional(),
  validUntilFrom: z.string().optional(),
  validUntilTo: z.string().optional(),
  correctionDeadlineFrom: z.string().optional(),
  correctionDeadlineTo: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.nativeEnum(ReportSortByEnum).optional(),
  direction: z.nativeEnum(SortDirectionEnum).optional(),
})

export const reportsRouter = router({
  list: protectedProcedure
    .input(listReportsInput.optional())
    .query(async ({ ctx, input }) => {
      return apiCall(listReports({ client: ctx.client, query: input }))
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return apiCall(getReportById({ client: ctx.client, path: { id: input.id } }))
    }),
})
