import z from 'zod'

import {
  communicationChannelSchema,
  signatureSchema,
  updateApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { CreateApplicationApplicationTypeEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const updateApplicationSchemaWithId = updateApplicationSchema.extend({
  id: z.string(),
})

const addDivisionMeetingForApplicationSchema = z.object({
  applicationId: z.string(),
  meetingDate: z.iso.datetime(),
  meetingLocation: z.string(),
  signature: signatureSchema,
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

const addDivisionEndingForApplicationSchema = z.object({
  applicationId: z.string(),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: signatureSchema,
  scheduledAt: z.string(),
  declaredClaims: z.number(),
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
    return await ctx.api.getTypes()
  }),
  getCategories: protectedProcedure
    .input(getCategoriesSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getCategories({ type: input.typeId })
    }),
  getBaseEntities: protectedProcedure.query(async ({ ctx }) => {
    const [{ types }, { categories }, { courtDistricts }] = await Promise.all([
      ctx.api.getTypes(),
      ctx.api.getCategories({}),
      ctx.api.getCourtDistricts(),
    ])

    return { types, categories, courtDistricts }
  }),
  updateApplication: protectedProcedure
    .input(updateApplicationSchemaWithId)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateApplicationDto } = input
      return await ctx.api.updateApplication({
        applicationId: id,
        updateApplicationDto: { ...updateApplicationDto },
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
      return await ctx.api.getApplicationById({
        applicationId: input.id,
      })
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
    .input(addDivisionMeetingForApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...dto } = input
      return await ctx.api.addDivisionMeetingAdvertToApplication({
        applicationId: applicationId,
        addDivisionMeetingForApplicationDto: dto,
      })
    }),
  addDivisionEnding: protectedProcedure
    .input(addDivisionEndingForApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { applicationId, ...dto } = input
      return await ctx.api.addDivisionEndingAdvertToApplication({
        applicationId: applicationId,
        addDivisionEndingForApplicationDto: dto,
      })
    }),
})
