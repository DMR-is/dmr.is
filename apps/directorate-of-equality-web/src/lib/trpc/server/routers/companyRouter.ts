import { z } from 'zod'

import {
  zCreateCompanyBody,
  zCreateCompanyCommentBody,
  zCreateCompanyCommentPath,
  zDeleteCompanyCommentPath,
  zGetCompanyCommentsPath,
  zGetCompanyTimelinePath,
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
})
