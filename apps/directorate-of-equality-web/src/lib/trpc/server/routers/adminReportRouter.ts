import { z } from 'zod'

import {
  zAdminEqualityReportDto,
  zAdminSalaryReportDto,
  zAnalyzeAdminSalaryReportBody,
  zAnalyzeAdminSalaryReportPath,
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

  // Detects outliers on a parsed workbook without creating a report, so the
  // create drawer can surface them and collect explanations before submit.
  analyzeSalary: protectedProcedure
    .input(
      z.object({
        path: zAnalyzeAdminSalaryReportPath,
        body: zAnalyzeAdminSalaryReportBody,
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.analyzeAdminSalaryReport({ path: input.path, body: input.body }),
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

  // The client uploads the .xlsx to S3 via a presigned URL, then passes the
  // resulting object `key` here to be fetched and parsed.
  requestImportUpload: protectedProcedure.mutation(({ ctx }) =>
    ctx.api.presignAdminImportUpload(),
  ),

  importWorkbook: protectedProcedure
    .input(
      z.object({
        path: z.object({ companyId: z.string() }),
        body: z.object({ key: z.string() }),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.importAdminSalaryReportWorkbook({
        path: input.path,
        body: { key: input.body.key },
      }),
    ),
})
