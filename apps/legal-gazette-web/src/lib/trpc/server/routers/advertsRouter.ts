import * as z from 'zod'

import { communicationChannelSchema } from '@dmr.is/legal-gazette/schemas'

import {
  RecallBankruptcyFieldsDtoRequirementStatementEnum,
  RecallDeceasedFieldsDtoRequirementStatementEnum,
  RecallDeceasedFieldsDtoSettlementTypeEnum,
  SortDirectionEnum,
} from '../../../../gen/fetch'
import { StatusIdEnum } from '../../../constants'
import {
  createAdvertAndCommonApplicationInput,
  createAdvertAndDeceasedApplicationInput,
  createAdvertAndRecallBankruptcyApplicationInput,
} from '../../../inputs'
import { protectedProcedure, router } from '../trpc'

const getAdvertsRequestSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  search: z.string().optional(),
  categoryId: z.array(z.string()).optional(),
  typeId: z.array(z.string()).optional(),
  statusId: z.array(z.string()).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.string().optional(),
  direction: z.enum(SortDirectionEnum).optional(),
})

const updateAdvertDtoSchema = z.object({
  id: z.string(),
  scheduledAt: z.array(z.string()).optional(),
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

export const createAdvertDtoSchema = z.object({
  typeId: z.string(),
  categoryId: z.string(),
  title: z.string(),
  content: z.string(),
  scheduledAt: z.array(z.string()),
  communicationChannels: z.array(communicationChannelSchema),
})

export const advertsRouter = router({
  createAdvert: protectedProcedure
    .input(createAdvertDtoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createAdvert({
        createAdvertDto: input,
      })
    }),
  getAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.api.getAdvertById({ advertId: input.id })
    }),
  getAdvertsCount: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.api.getAdvertsCount(input)
    }),
  getAdvertsInProgress: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => {
      const allowedStatuses = [StatusIdEnum.SUBMITTED, StatusIdEnum.IN_PROGRESS]

      const matchingStatuses = allowedStatuses.filter((status) =>
        input.statusId?.includes(status),
      )

      return await ctx.api.getAdverts({
        ...input,
        statusId:
          matchingStatuses.length > 0 ? matchingStatuses : allowedStatuses,
      })
    }),
  getReadyForPublicationAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.api.getAdverts({
          ...input,
          statusId: [StatusIdEnum.READY_FOR_PUBLICATION],
        }),
    ),
  getInPublishingAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.api.getAdverts({
          ...input,
          statusId: [StatusIdEnum.IN_PUBLISHING],
        }),
    ),
  getCompletedAdverts: protectedProcedure
    .input(getAdvertsRequestSchema)
    .query(async ({ ctx, input }) => await ctx.api.getAdverts(input)),
  updateAdvert: protectedProcedure
    .input(updateAdvertDtoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input
      return await ctx.api.updateAdvert({
        id: id,
        updateAdvertDto: rest,
      })
    }),
  assignUser: protectedProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.assignAdvertToEmployee({
        id: input.id,
        userId: input.userId,
      })
    }),
  assignAndUpdateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await Promise.all([
        await ctx.api.assignAdvertToEmployee({
          id: input.id,
          userId: input.userId,
        }),
        await ctx.api.moveAdvertToNextStatus({
          id: input.id,
        }),
      ])
    }),
  moveToNextStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.moveAdvertToNextStatus({
        id: input.id,
      })
    }),
  moveToPreviousStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.moveAdvertToPreviousStatus({
        id: input.id,
      })
    }),
  moveToPreviousStatusBulk: protectedProcedure
    .input(z.object({ advertIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return await Promise.all(
        input.advertIds.map((id) =>
          ctx.api.moveAdvertToPreviousStatus({
            id,
          }),
        ),
      )
    }),
  rejectAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.rejectAdvert({
        id: input.id,
      })
    }),
  reactivateAdvert: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.reactivateAdvert({
        id: input.id,
      })
    }),
  createAdvertAndCommonApplication: protectedProcedure
    .input(createAdvertAndCommonApplicationInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createAdvertAndCommonApplication({
        createCommonAdvertAndApplicationDto: {
          applicantNationalId: input.applicantNationalId,
          communicationChannels: input.communicationChannels,
          fields: {
            caption: input.fields.caption,
            categoryId: input.fields.category.id,
            content: input.fields.html,
            typeId: input.fields.type.id,
          },
          publishingDates: input.publishingDates,
          signature: input.signature,
          additionalText: input.additionalText,
        },
      })
    }),
  createRecallBankruptcyAdvertAndApplication: protectedProcedure
    .input(createAdvertAndRecallBankruptcyApplicationInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createAdvertAndRecallBankruptcyApplication({
        createRecallBankruptcyAdvertAndApplicationDto: {
          applicantNationalId: input.applicantNationalId,
          communicationChannels: input.communicationChannels,
          publishingDates: input.publishingDates,
          signature: input.signature,
          additionalText: input.additionalText,
          fields: {
            courtDistrictId:
              input.fields.courtAndJudgmentFields.courtDistrict.id,
            judgmentDate: input.fields.courtAndJudgmentFields.judgmentDate,
            meetingDate: input.fields.divisionMeetingFields.meetingDate,
            meetingLocation: input.fields.divisionMeetingFields.meetingLocation,
            liquidatorLocation:
              input.fields.settlementFields.liquidatorLocation,
            liquidatorName: input.fields.settlementFields.liquidatorName,
            requirementStatementLocation:
              input.fields.settlementFields.recallRequirementStatementLocation,
            requirementStatement: input.fields.settlementFields
              .recallRequirementStatementType as unknown as RecallBankruptcyFieldsDtoRequirementStatementEnum,
            settlementAddress: input.fields.settlementFields.address,
            settlementDate: input.fields.settlementFields.deadlineDate,
            settlementName: input.fields.settlementFields.name,
            settlementNationalId: input.fields.settlementFields.nationalId,
          },
        },
      })
    }),
  createRecallDeceasedAdvertAndApplication: protectedProcedure
    .input(createAdvertAndDeceasedApplicationInput)
    .mutation(async ({ ctx, input }) => {
      return await ctx.api.createAdvertAndRecallDeceasedApplication({
        createRecallDeceasedAdvertAndApplicationDto: {
          applicantNationalId: input.applicantNationalId,
          communicationChannels: input.communicationChannels,
          publishingDates: input.publishingDates,
          signature: input.signature,
          additionalText: input.additionalText,
          fields: {
            courtDistrictId:
              input.fields.courtAndJudgmentFields.courtDistrict.id,
            judgmentDate: input.fields.courtAndJudgmentFields.judgmentDate,
            meetingDate:
              input.fields.divisionMeetingFields?.meetingDate || undefined,
            meetingLocation:
              input.fields.divisionMeetingFields?.meetingLocation || undefined,
            liquidatorLocation:
              input.fields.settlementFields.liquidatorLocation,
            liquidatorName: input.fields.settlementFields.liquidatorName,
            requirementStatementLocation:
              input.fields.settlementFields.recallRequirementStatementLocation,
            requirementStatement: input.fields.settlementFields
              .recallRequirementStatementType as unknown as RecallDeceasedFieldsDtoRequirementStatementEnum,
            settlementAddress: input.fields.settlementFields.address,
            settlementDate: input.fields.settlementFields.dateOfDeath,
            settlementName: input.fields.settlementFields.name,
            settlementNationalId: input.fields.settlementFields.nationalId,
            settlementType: input.fields.settlementFields
              .type as RecallDeceasedFieldsDtoSettlementTypeEnum,
            companies: input.fields.settlementFields.companies,
          },
        },
      })
    }),
})
