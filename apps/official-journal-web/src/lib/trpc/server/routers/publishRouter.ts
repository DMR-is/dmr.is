import { z } from 'zod'

import {
  CaseStatusEnum,
  DepartmentEnum,
} from '../../../../gen/fetch'
import { getParamsWithoutNullOrEmpty } from '../../../utils'
import { protectedProcedure, router } from '../trpc'

export const publishRouter = router({
  publishCases: protectedProcedure
    .input(
      z.object({
        caseIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.api.publish({
        postCasePublishBody: {
          caseIds: input.caseIds,
        },
      })
    }),

  getCasesWithPublicationNumber: protectedProcedure
    .input(
      z.object({
        department: z.nativeEnum(DepartmentEnum),
        id: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getCasesWithPublicationNumber(input)
    }),

  getCasesWithStatusCount: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(CaseStatusEnum),
        statuses: z.array(z.nativeEnum(CaseStatusEnum)).optional(),
        id: z.array(z.string()).optional(),
        applicationId: z.string().optional(),
        search: z.string().optional(),
        year: z.number().optional(),
        department: z.array(z.string()).optional(),
        type: z.array(z.string()).optional(),
        category: z.array(z.string()).optional(),
        employeeId: z.string().optional(),
        published: z.boolean().optional(),
        fastTrack: z.boolean().optional(),
        institution: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        sortBy: z.string().optional(),
        direction: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const castedInput = getParamsWithoutNullOrEmpty(input)
      return ctx.api.getCasesWithStatusCount(castedInput)
    }),

  getCasesWithDepartmentCount: protectedProcedure
    .input(
      z.object({
        department: z.nativeEnum(DepartmentEnum),
        id: z.array(z.string()).optional(),
        applicationId: z.string().optional(),
        search: z.string().optional(),
        year: z.number().optional(),
        status: z.array(z.string()).optional(),
        type: z.array(z.string()).optional(),
        category: z.array(z.string()).optional(),
        employeeId: z.string().optional(),
        published: z.boolean().optional(),
        fastTrack: z.boolean().optional(),
        institution: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
        sortBy: z.string().optional(),
        direction: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.api.getCasesWithDepartmentCount(input)
    }),

  publishAdvertRegulation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.publishSingleRegulation({ id: input.id })
    }),
})
