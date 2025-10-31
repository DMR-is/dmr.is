import { z } from 'zod'

export const baseEntitySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
})

export const communicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

export const signatureSchema = z.object({
  name: z.string().nullable().optional(),
  onBehalfOf: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  date: z.date().nullable().optional(),
})

export const createCommonAdvertFromIslandIsApplicationSchema = z.object({
  islandIsApplicationId: z.string(),
  categoryId: z.string(),
  typeId: z.string(),
  caption: z.string(),
  additionalText: z.string().nullable().optional(),
  html: z.string(),
  communicationChannels: z.array(communicationChannelSchema).min(1),
  publishingDates: z.array(z.date()).min(1),
  signature: signatureSchema.optional(),
})

export const createRecallAdvertFromApplicationSchema = z.object({
  courtDistrictId: z.uuid(),
  settlementName: z.string(),
  settlementNationalId: z.string(),
  settlementAddress: z.string(),
  settlementDeadlineDate: z.date().nullable().optional(),
  settlementDateOfDeath: z.date().optional().nullable(),
  liquidatorName: z.string(),
  liquidatorLocation: z.string(),
  divisionMeetingLocation: z.string().optional().nullable(),
  divisionMeetingDate: z.date().optional().nullable(),
  judgementDate: z.date(),
  communicationChannels: z.array(communicationChannelSchema).min(1),
  signature: signatureSchema.optional(),
})

export const applicationSchema = z.object({
  id: z.uuid(),
  type: baseEntitySchema,
  category: baseEntitySchema.nullable(),
  caption: z.string(),
  additionalText: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const applicationDetailedSchema = applicationSchema.extend({
  html: z.string(),
})
