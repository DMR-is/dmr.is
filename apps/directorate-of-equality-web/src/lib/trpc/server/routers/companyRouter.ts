import { z } from 'zod'

import {
  zCreateCompanyBody,
  zCreateCompanyCommentBody,
  zCreateCompanyCommentPath,
  zDeleteCompanyCommentPath,
  zGetCompanyCommentsPath,
  zGetCompanyTimelinePath,
  zGetRskCompanyPreviewPath,
  zRskLookupCompanyPath,
  zUpdateCompanyEmailBody,
  zUpdateCompanyEmailPath,
  zUpdateCompanyFinesBody,
  zUpdateCompanyFinesPath,
  zUpdateCompanyQuarantineBody,
  zUpdateCompanyQuarantinePath,
} from '../../../../gen/fetch/zod.gen'
import { protectedProcedure, router } from '../trpc'

const zGetCompaniesQuery = z.object({
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).optional(),
  q: z.string().optional(),
  employeeCountCategory: z
    .enum(['UNKNOWN', 'SMALL', 'MEDIUM', 'LARGE'])
    .optional(),
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
  finesStarted: z.boolean().optional(),
  quarantined: z.boolean().optional(),
  overdue: z.boolean().optional(),
  isatCategoryCode: z.array(z.string()).optional(),
  regionCode: z.array(z.string()).optional(),
  postcode: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'employeeCount', 'nextReportDue']).optional(),
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

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.api.getCompanyById({ path: { id: input.id } }),
    ),

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

  // RSK-backed preview of the fields we auto-map at creation (name, address,
  // postcode, ÍSAT, status), shown read-only on the create screen.
  rskPreview: protectedProcedure
    .input(zGetRskCompanyPreviewPath)
    .query(({ ctx, input }) =>
      ctx.api.getRskCompanyPreview({ path: { nationalId: input.nationalId } }),
    ),

  create: protectedProcedure
    .input(zCreateCompanyBody)
    .mutation(({ ctx, input }) => ctx.api.createCompany({ body: input })),

  getTimeline: protectedProcedure
    .input(zGetCompanyTimelinePath)
    .query(({ ctx, input }) =>
      ctx.api.getCompanyTimeline({ path: { id: input.id } }),
    ),

  comments: router({
    list: protectedProcedure
      .input(zGetCompanyCommentsPath)
      .query(({ ctx, input }) =>
        ctx.api.getCompanyComments({ path: { id: input.id } }),
      ),

    create: protectedProcedure
      .input(zCreateCompanyCommentPath.extend(zCreateCompanyCommentBody.shape))
      .mutation(({ ctx, input }) =>
        ctx.api.createCompanyComment({
          path: { id: input.id },
          body: { body: input.body },
        }),
      ),

    delete: protectedProcedure
      .input(zDeleteCompanyCommentPath)
      .mutation(async ({ ctx, input }) => {
        await ctx.api.deleteCompanyComment({
          path: { id: input.id, commentId: input.commentId },
        })
      }),
  }),
  // Annual register import. The client uploads the .xlsx straight to S3 via a
  // presigned URL, then passes the resulting object `key` here. The same key is
  // previewed and then applied (uploaded once). `preview` writes nothing;
  // `apply` commits.
  requestImportUpload: protectedProcedure.mutation(({ ctx }) =>
    ctx.api.presignAdminImportUpload(),
  ),

  // Toggle the daily-fines flag (handled outside this system). `finesStarted`
  // true starts the process, false clears it; `reason` is kept on the company
  // timeline for audit.
  updateFines: protectedProcedure
    .input(zUpdateCompanyFinesPath.extend(zUpdateCompanyFinesBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.updateCompanyFines({
        path: { id: input.id },
        body: { finesStarted: input.finesStarted, reason: input.reason },
      }),
    ),

  // Admin-set contact email read by the deadline-reminder task. Empty/null
  // clears it.
  updateEmail: protectedProcedure
    .input(zUpdateCompanyEmailPath.extend(zUpdateCompanyEmailBody.shape))
    .mutation(({ ctx, input }) =>
      ctx.api.updateCompanyEmail({
        path: { id: input.id },
        body: { email: input.email },
      }),
    ),

  // Admin halt switch — suspends all outbound activity for the company.
  // `quarantined` true halts, false lifts; `reason` is kept on the timeline.
  updateQuarantine: protectedProcedure
    .input(
      zUpdateCompanyQuarantinePath.extend(zUpdateCompanyQuarantineBody.shape),
    )
    .mutation(({ ctx, input }) =>
      ctx.api.updateCompanyQuarantine({
        path: { id: input.id },
        body: { quarantined: input.quarantined, reason: input.reason },
      }),
    ),

  // Annual register import. The file arrives base64-encoded (tRPC has no
  // multipart), is rebuilt into a Blob, and forwarded to the multipart API.
  // `preview` writes nothing; `apply` commits. Same input shape for both.
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
