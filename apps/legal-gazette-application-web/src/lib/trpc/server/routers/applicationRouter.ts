import z from 'zod'

import {
  CommonApplicationSchema,
  commonApplicationSchema,
  createDivisionEndingInput,
  createDivisionEndingWithIdInput,
  createDivisionMeetingInput,
  createDivisionMeetingWithIdInput,
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'

import { CreateApplicationApplicationTypeEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

export const createApplicationSchema = z.enum(
  CreateApplicationApplicationTypeEnum,
)

export const getCategoriesSchema = z.object({
  typeId: z.string().optional(),
})

export const getApplicationsSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
})

export const applicationRouter = router({
  getTypes: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.api.getTypes({
      excludeUnassignable: true,
    })
  }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getCategories({
        type: input.typeId,
        excludeUnassignable: true,
      })
    }),
  getBaseEntities: protectedProcedure.query(async ({ ctx }) => {
    const [{ types }, { categories }, { courtDistricts }] = await Promise.all([
      ctx.api.getTypes({
        excludeUnassignable: true,
      }),
      ctx.api.getCategories({}),
      ctx.api.getCourtDistricts(),
    ])

    return { types, categories, courtDistricts }
  }),
  updateApplication: protectedProcedure
    .input(updateApplicationWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...applicationAnswers } = input
      return await ctx.api.updateApplication({
        applicationId: input.id,
        updateApplicationDto: {
          answers: { ...applicationAnswers.answers },
        },
      })
    }),
  getApplications: protectedProcedure
    .input(getApplicationsSchema.optional())
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyApplications({
        page: input?.page,
        pageSize: input?.pageSize,
      })
    }),
  getCommonApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.api.getApplicationById({
        applicationId: input.id,
      })

      const parsed = commonApplicationSchema.parse({
        type: application.type,
        answers: { ...application.answers },
      })

      return {
        ...application,
        answers: parsed.answers as CommonApplicationSchema,
      }
    }),
  getRecallBankruptcyApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.api.getApplicationById({
        applicationId: input.id,
      })

      const parsed = recallBankruptcyApplicationSchema.parse(application)

      return {
        ...application,
        answers: parsed.answers,
      }
    }),
  getRecallDeceasedApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.api.getApplicationById({
        applicationId: input.id,
      })

      const parsed = recallDeceasedApplicationSchema.parse(application)

      return {
        ...application,
        answers: parsed.answers,
      }
    }),
  getApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(
      async ({ ctx, input }) =>
        await ctx.api.getApplicationById({
          applicationId: input.id,
        }),
    ),
  createApplication: protectedProcedure
    .input(createApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createApplication({
        applicationType: input,
      })
    }),
  submitApplication: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.submitApplication({
        applicationId: input.id,
      })
    }),
  addDivisionMeeting: protectedProcedure
    .input(createDivisionMeetingWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...rest } = input
      return await ctx.api.addDivisionMeetingAdvertToApplication({
        applicationId: applicationId,
        createDivisionMeetingDto: rest,
      })
    }),
  addDivisionEnding: protectedProcedure
    .input(createDivisionEndingWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...rest } = input
      return await ctx.api.addDivisionEndingAdvertToApplication({
        applicationId: input.applicationId,
        createDivisionEndingDto: rest,
      })
    }),
})
