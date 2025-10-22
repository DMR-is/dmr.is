import { z } from 'zod'

import { StatusIdEnum } from '../../../../gen/fetch'
import { protectedProcedure, router } from '../trpc'

const getAdvertsRequestSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.array(z.string()).optional(),
  statusId: z.array(z.enum(StatusIdEnum)).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

const updateAdvertDtoSchema = z.object({
  id: z.string(),
  scheduledAt: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().optional(),
  typeId: z.string().optional(),
  additionalText: z.string().optional(),
  caption: z.string().optional(),
  signatureName: z.string().optional(),
  signatureLocation: z.string().optional(),
  signatureOnBehalfOf: z.string().optional(),
  signatureDate: z.string().optional(),
  divisionMeetingLocation: z.string().optional(),
  divisionMeetingDate: z.string().optional(),
  judgementDate: z.string().optional(),
  courtDistrictId: z.string().optional(),
})

export const advertsRouter = router({
  getAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.advertsApi.getAdvertById({ id: input.id })
    }),
  getAdvertsCount: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.advertsApi.getAdvertsCount()
  }),
  getSubmittedAdverts: protectedProcedure.input(getAdvertsRequestSchema).query(
    async ({ ctx, input }) =>
      await ctx.advertsApi.getAdverts({
        ...input,
        statusId: [StatusIdEnum.SUBMITTED],
      }),
  ),
  getReadyForPublicationAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.advertsApi.getAdverts({
          ...input,
          statusId: [StatusIdEnum.READY_FOR_PUBLICATION],
        }),
    ),
  getCompletedAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => await ctx.advertsApi.getAdverts(input)),
  updateAdvert: protectedProcedure
    .input(updateAdvertDtoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input
      return await ctx.adverts.updateApi.updateAdvert({
        id: id,
        updateAdvertDto: rest,
      })
    }),
  assignUser: protectedProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.adverts.updateApi.assignAdvertToEmployee({
        id: input.id,
        userId: input.userId,
      })
    }),
  moveToNextStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.adverts.updateApi.moveAdvertToNextStatus({
        id: input.id,
      })
    }),
  moveToPreviousStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.adverts.updateApi.moveAdvertToPreviousStatus({
        id: input.id,
      })
    }),
})
