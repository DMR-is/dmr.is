import z from 'zod'

import { CreateApplicationApplicationTypeEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

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
  signatureName: z.string().nullable().optional(),
  signatureOnBehalfOf: z.string().nullable().optional(),
  signatureLocation: z.string().nullable().optional(),
  signatureDate: z.string().nullable().optional(),
  liquidatorName: z.string().nullable().optional(),
  liquidatorLocation: z.string().nullable().optional(),
  liquidatorOnBehalfOf: z.string().nullable().optional(),
  settlementName: z.string().nullable().optional(),
  settlementNationalId: z.string().nullable().optional(),
  settlementAddress: z.string().nullable().optional(),
  settlementDeadlineDate: z.string().nullable().optional(),
  settlementDateOfDeath: z.string().nullable().optional(),
  divisionMeetingDate: z.string().nullable().optional(),
  divisionMeetingLocation: z.string().nullable().optional(),
  publishingDates: z.array(z.string()).optional(),
  communicationChannels: z
    .array(
      z.object({
        email: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
      }),
    )
    .optional(),
})

export const createApplicationSchema = z.enum(
  CreateApplicationApplicationTypeEnum,
)

export const getApplicationsSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
})

export const applicationRouter = router({
  getBaseEntities: protectedProcedure.query(async ({ ctx }) => {
    const [{ types }, { categories }, { courtDistricts }] = await Promise.all([
      ctx.applicationApi.getTypes(),
      ctx.applicationApi.getCategories({}),
      ctx.applicationApi.getCourtDistricts(),
    ])

    return { types, categories, courtDistricts }
  }),
  updateApplication: protectedProcedure
    .input(updateApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateApplicationDto } = input
      return await ctx.applicationApi.updateApplication({
        applicationId: id,
        updateApplicationDto: updateApplicationDto,
      })
    }),
  getApplications: protectedProcedure
    .input(getApplicationsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.applicationApi.getMyApplications({
        page: input.page,
        pageSize: input.pageSize,
      })
    }),
  getApplicationById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.applicationApi.getApplicationById({
        applicationId: input.id,
      })
    }),
  createApplication: protectedProcedure
    .input(createApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.applicationApi.createApplication({
        applicationType: input,
      })
    }),
})
