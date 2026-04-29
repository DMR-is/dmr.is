import { z } from 'zod'

import { GenderEnum, ReportProviderEnum } from '../../../../gen/fetch'
import { createEqualityReport, createSalaryReport } from '../../../../gen/fetch'
import { apiCall } from '../../../api/apiCall'
import { protectedProcedure, router } from '../trpc'

const createReportBaseInput = z.object({
  identifier: z.string(),
  importedFromExcel: z.boolean(),
  providerType: z.nativeEnum(ReportProviderEnum),
  providerId: z.string().nullish(),
  companyAdminName: z.string(),
  companyAdminEmail: z.string(),
  companyAdminGender: z.nativeEnum(GenderEnum),
  contactName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  averageEmployeeMaleCount: z.number(),
  averageEmployeeFemaleCount: z.number(),
  averageEmployeeNeutralCount: z.number(),
  parsed: z.any(),
  companies: z.array(z.any()),
  deviations: z.array(z.any()).optional(),
})

export const reportCreateRouter = router({
  createSalaryReport: protectedProcedure
    .input(
      createReportBaseInput.extend({
        equalityReportId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiCall(createSalaryReport({ client: ctx.client, body: input }))
    }),

  createEqualityReport: protectedProcedure
    .input(
      z.object({
        identifier: z.string(),
        providerType: z.nativeEnum(ReportProviderEnum),
        providerId: z.string().nullish(),
        companyAdminName: z.string(),
        companyAdminEmail: z.string(),
        companyAdminGender: z.nativeEnum(GenderEnum),
        contactName: z.string(),
        contactEmail: z.string(),
        contactPhone: z.string(),
        equalityReportContent: z.string(),
        companies: z.array(z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return apiCall(createEqualityReport({ client: ctx.client, body: input }))
    }),
})
