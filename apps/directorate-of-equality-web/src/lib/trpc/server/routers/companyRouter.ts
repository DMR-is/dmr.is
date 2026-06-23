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
      z.enum([
        'MISSING_EQUALITY_REPORT',
        'MISSING_SALARY_REPORT',
        'MISSING_ACTION_PLAN',
        'SATISFACTORY',
      ]),
    )
    .optional(),
  expiresWithin: z.array(z.enum(['30d', '3m', 'soon'])).optional(),
  isatCategoryCode: z.array(z.string()).optional(),
  regionCode: z.array(z.string()).optional(),
  postcode: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'employeeCount']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

const zSearchIsatCategoriesQuery = z.object({
  q: z.string().optional(),
  codes: z.array(z.string()).optional(),
})

export const companyRouter = router({
  list: protectedProcedure
    .input(zGetCompaniesQuery.optional())
    .query(({ ctx, input }) => ctx.api.getCompanies({ query: input as never })),

  // Backs the searchable ÍSAT filter: free-text `q` for matches, or `codes` to
  // resolve the labels of an existing selection.
  isatCategories: protectedProcedure
    .input(zSearchIsatCategoriesQuery.optional())
    .query(({ ctx, input }) =>
      ctx.api.searchIsatCategories({ query: input as never }),
    ),

  rskLookup: protectedProcedure
    .input(zRskLookupCompanyPath)
    .query(({ ctx, input }) =>
      ctx.api.rskLookupCompany({ path: { nationalId: input.nationalId } }),
    ),

  create: protectedProcedure
    .input(zCreateCompanyBody)
    .mutation(({ ctx, input }) => ctx.api.createCompany({ body: input })),

  // Annual register import. The file arrives base64-encoded (tRPC has no
  // multipart), is rebuilt into a Blob, and forwarded to the multipart API.
  // `preview` writes nothing; `apply` commits. Same input shape for both.
  importPreview: protectedProcedure
    .input(z.object({ file: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.previewCompanyImport({ body: { file: toXlsxBlob(input.file) } }),
    ),

  importApply: protectedProcedure
    .input(z.object({ file: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.applyCompanyImport({ body: { file: toXlsxBlob(input.file) } }),
    ),
})

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const toXlsxBlob = (base64: string): Blob =>
  new Blob([Buffer.from(base64, 'base64')], { type: XLSX_MIME })
