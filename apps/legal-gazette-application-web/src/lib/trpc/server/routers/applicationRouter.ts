import z from 'zod'

import {
  CommonApplicationSchema,
  commonApplicationSchema,
  createDivisionEndingInput,
  createDivisionMeetingInput,
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
  updateApplicationWithIdInput,
} from '@dmr.is/legal-gazette/schemas'

import {
  ApplicationTypeEnum,
  CreateApplicationApplicationTypeEnum,
} from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

import { TRPCError } from '@trpc/server'

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
    .query(async ({ ctx, input }) => {
      const application = await ctx.api.getApplicationById({
        applicationId: input.id,
      })

      switch (application.type) {
        case ApplicationTypeEnum.COMMON: {
          const parsed = commonApplicationSchema.safeParse({
            type: application.type,
            answers: { ...application.answers },
          })

          if (!parsed.success) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Invalid common application data`,
            })
          }

          return {
            ...application,
            answers: parsed.data.answers,
          }
        }
        case ApplicationTypeEnum.RECALLBANKRUPTCY: {
          const parsed = recallBankruptcyApplicationSchema.parse(application)

          return {
            ...application,
            answers: parsed.answers,
          }
        }
        case ApplicationTypeEnum.RECALLDECEASED: {
          const parsed = recallDeceasedApplicationSchema.parse(application)

          return {
            ...application,
            answers: parsed.answers,
          }
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
    .input(createDivisionMeetingInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.addDivisionMeetingAdvertToApplication({
        applicationId: 'some-id',
        createDivisionMeetingDto: input,
      })
    }),
  addDivisionEnding: protectedProcedure
    .input(createDivisionEndingInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.addDivisionEndingAdvertToApplication({
        applicationId: 'some-id',
        createDivisionEndingDto: input,
      })
    }),
})
