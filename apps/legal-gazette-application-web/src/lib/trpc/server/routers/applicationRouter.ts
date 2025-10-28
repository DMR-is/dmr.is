import z from 'zod'

import { CreateApplicationApplicationTypeEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const createCommunicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

const signatureSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  onBehalfOf: z.string().optional(),
})

export const updateApplicationSchema = z.object({
  id: z.string(),
  typeId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  courtDistrictId: z.string().nullable().optional(),
  islandIsApplicationId: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  additionalText: z.string().nullable().optional(),
  judgmentDate: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  liquidatorName: z.string().nullable().optional(),
  liquidatorLocation: z.string().nullable().optional(),
  settlementName: z.string().nullable().optional(),
  settlementNationalId: z.string().nullable().optional(),
  settlementAddress: z.string().nullable().optional(),
  settlementDeadlineDate: z.string().nullable().optional(),
  settlementDateOfDeath: z.string().nullable().optional(),
  divisionMeetingDate: z.string().nullable().optional(),
  divisionMeetingLocation: z.string().nullable().optional(),
  publishingDates: z.array(z.string()).optional(),
  signature: signatureSchema.optional(),
  communicationChannels: z.array(createCommunicationChannelSchema).optional(),
})

const addDivisionMeetingForApplicationSchema = z.object({
  applicationId: z.string(),
  meetingDate: z.string(),
  meetingLocation: z.string(),
  signature: signatureSchema.optional(),
  additionalText: z.string().optional(),
  communicationChannels: z
    .array(createCommunicationChannelSchema)
    .optional()
    .optional(),
})

const addDivisionEndingForApplicationSchema = z.object({
  applicationId: z.string(),
  additionalText: z.string().optional(),
  communicationChannels: z.array(createCommunicationChannelSchema).optional(),
  signature: signatureSchema.optional(),
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
    .input(updateApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateApplicationDto } = input
      return await ctx.api.updateApplication({
        applicationId: id,
        updateApplicationDto: updateApplicationDto,
      })
    }),
  getApplications: protectedProcedure
    .input(getApplicationsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getMyApplications({
        page: input.page,
        pageSize: input.pageSize,
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
