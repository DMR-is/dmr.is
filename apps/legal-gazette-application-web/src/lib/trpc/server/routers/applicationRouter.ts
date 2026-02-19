import * as z from 'zod'

import {
  createDivisionEndingWithIdInput,
  createDivisionMeetingWithIdInput,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'

import {
  ApplicationStatusEnum,
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
  SortDirectionEnum,
} from '../../../../gen/fetch'
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
  sortBy: z.string().optional(),
  direction: z.enum(SortDirectionEnum).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(ApplicationTypeEnum).optional(),
  status: z.enum(ApplicationStatusEnum).optional(),
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
      ctx.api.getCategories({ excludeUnassignable: true }),
      ctx.api.getCourtDistricts(),
    ])

    return { types, categories, courtDistricts }
  }),
  getCourtDistricts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.api.getCourtDistricts()
  }),
  updateApplication: protectedProcedure
    .input(updateApplicationWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { id, currentStep, ...applicationAnswers } = input
      return await ctx.api.updateApplication({
        applicationId: input.id,
        updateApplicationDto: {
          currentStep,
          answers: { ...applicationAnswers.answers },
        },
      })
    }),
  getApplications: protectedProcedure
    .input(getApplicationsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyApplications(input)
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
  getMininumDateForDivisionMeeting: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMinDateForDivisionMeeting({
        applicationId: input.applicationId,
      })
    }),
  getMinumDateForDivisionEnding: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMinDateForDivisionEnding({
        applicationId: input.applicationId,
      })
    }),
  addDivisionMeeting: protectedProcedure
    .input(createDivisionMeetingWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...rest } = input
      return await ctx.api.addDivisionMeeting({
        applicationId: applicationId,
        createDivisionMeetingDto: rest,
      })
    }),
  addDivisionEnding: protectedProcedure
    .input(createDivisionEndingWithIdInput)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...rest } = input

      return await ctx.api.addDivisionEnding({
        applicationId: input.applicationId,
        createDivisionEndingDto: rest,
      })
    }),
  getMyAdverts: protectedProcedure
    .input(getApplicationsSchema.optional())
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyAdverts({
        page: input?.page,
        pageSize: input?.pageSize,
      })
    }),
  getMyLegacyAdverts: protectedProcedure
    .input(getApplicationsSchema.optional())
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyLegacyAdverts({
        page: input?.page,
        pageSize: input?.pageSize,
      })
    }),
  getPreviewHTML: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const previewHTML = await ctx.api.previewApplication({
        applicationId: input.applicationId,
      })
      return previewHTML
    }),
  getEstimatedPrice: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.api.getApplicationPrice({
        applicationId: input.applicationId,
      })
    }),
  deleteApplication: protectedProcedure
    .input(z.object({ applicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.deleteApplication({
        applicationId: input.applicationId,
      })
    }),
  deleteAdvertFromApplication: protectedProcedure
    .input(z.object({ applicationId: z.string(), advertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.deleteAdvertFromApplication({
        applicationId: input.applicationId,
        advertId: input.advertId,
      })
    }),
})
