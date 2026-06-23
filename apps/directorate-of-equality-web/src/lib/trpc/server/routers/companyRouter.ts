import { z } from 'zod'

import {
  zCreateCompanyBody,
  zRskLookupCompanyPath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

const zGetCompaniesQuery = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).optional(),
  q: z.string().optional(),
  employeeCountCategory: z.enum(['UNKNOWN', 'SMALL', 'MEDIUM', 'LARGE']).optional(),
  companyStatus: z
    .array(
      z.enum(['missing-equality', 'has-equality', 'missing-salary', 'compliant']),
    )
    .optional(),
  expiresWithin: z.array(z.enum(['30d', '3m', 'soon'])).optional(),
  sortBy: z.enum(['name', 'employeeCount']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const companyRouter = router({
  list: protectedProcedure
    .input(zGetCompaniesQuery.optional())
    .query(({ ctx, input }) => ctx.api.getCompanies({ query: input as never })),

  rskLookup: protectedProcedure
    .input(zRskLookupCompanyPath)
    .query(({ ctx, input }) =>
      ctx.api.rskLookupCompany({ path: { nationalId: input.nationalId } }),
    ),

  create: protectedProcedure
    .input(zCreateCompanyBody)
    .mutation(({ ctx, input }) => ctx.api.createCompany({ body: input })),

  // Annual register import. The client uploads the .xlsx straight to S3 via a
  // presigned URL, then passes the resulting object `key` here. The same key is
  // previewed and then applied (uploaded once). `preview` writes nothing;
  // `apply` commits.
  requestImportUpload: protectedProcedure.mutation(({ ctx }) =>
    ctx.api.presignAdminImportUpload(),
  ),

  importPreview: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.previewCompanyImport({ body: { key: input.key } }),
    ),

  importApply: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.applyCompanyImport({ body: { key: input.key } }),
    ),
})
