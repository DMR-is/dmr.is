import { z } from 'zod'

import {
  zAdminEqualityReportDto,
  zAdminSalaryReportDto,
  zSubmitAdminEqualityReportPath,
  zSubmitAdminSalaryReportPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

export const adminReportRouter = router({
  submitEquality: protectedProcedure
    .input(
      z.object({
        path: zSubmitAdminEqualityReportPath,
        body: zAdminEqualityReportDto,
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.submitAdminEqualityReport({ path: input.path, body: input.body }),
    ),

  submitSalary: protectedProcedure
    .input(
      z.object({
        path: zSubmitAdminSalaryReportPath,
        body: zAdminSalaryReportDto,
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.submitAdminSalaryReport({ path: input.path, body: input.body }),
    ),

  importWorkbook: protectedProcedure
    .input(
      z.object({
        path: z.object({ companyId: z.string() }),
        body: z.object({ file: z.string() }),
      }),
    )
    .mutation(({ ctx, input }) => {
      const buffer = Buffer.from(input.body.file, 'base64')
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      return ctx.api.importAdminSalaryReportWorkbook({
        path: input.path,
        body: { file: blob },
      })
    }),
})
