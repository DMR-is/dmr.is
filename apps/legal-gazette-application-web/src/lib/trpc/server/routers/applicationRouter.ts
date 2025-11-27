import z from 'zod'

import {
  addDivisionEndingInputSchema,
  addDivisionMeetingInputSchema,
  CommonApplicationSchema,
  commonApplicationSchema,
  isCommonApplication,
  isUpdateCommonApplication,
  RecallApplicationSchema,
  recallApplicationSchema,
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
  updateApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import {
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
} from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

import { TRPCError } from '@trpc/server'

export const updateApplicationInputSchema = z.object({
  id: z.string(),
  answers: updateApplicationSchema,
})

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
    .input(updateApplicationInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.updateApplication({
        applicationId: input.id,
        updateApplicationDto: { answers: input.answers },
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
  getApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await ctx.api.getApplicationById({
        applicationId: input.id,
      })

      switch (application.type) {
        case ApplicationTypeEnum.COMMON: {
          return commonApplicationSchema.parse(application)
        }
        case ApplicationTypeEnum.RECALLBANKRUPTCY: {
          return recallBankruptcyApplicationSchema.parse(application)
        }
        case ApplicationTypeEnum.RECALLDECEASED: {
          return recallDeceasedApplicationSchema.parse(application)
        }
        default: {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Application type ${application.type} is not supported in the application web`,
          })
        }
      }
    }),
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
    .input(addDivisionMeetingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...dto } = input
      return await ctx.api.addDivisionMeetingAdvertToApplication({
        applicationId: applicationId,
        addDivisionMeetingForApplicationDto: dto,
      })
    }),
  addDivisionEnding: protectedProcedure
    .input(addDivisionEndingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...dto } = input
      return await ctx.api.addDivisionEndingAdvertToApplication({
        applicationId: applicationId,
        addDivisionEndingForApplicationDto: dto,
      })
    }),
})
