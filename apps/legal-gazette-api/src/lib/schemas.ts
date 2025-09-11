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

export const createCommonAdvertFromApplicationSchema = z.object({
  caseId: z.uuid(),
  type: baseEntitySchema,
  category: baseEntitySchema,
  caption: z.string(),
  additionalText: z.string().nullable().optional(),
  html: z.string(),
  signatureName: z.string(),
  signatureOnBehalfOf: z.string().nullable().optional(),
  signatureLocation: z.string(),
  signatureDate: z.date(),
  communicationChannels: z.array(communicationChannelSchema).min(1),
  publishingDates: z.array(z.date()).min(1),
})

export const createCommonAdvertFromIslandIsApplicationSchema = z.object({
  islandIsApplicationId: z.string(),
  categoryId: z.string(),
  caption: z.string(),
  additionalText: z.string().nullable().optional(),
  html: z.string(),
  signatureName: z.string(),
  signatureOnBehalfOf: z.string().nullable().optional(),
  signatureLocation: z.string(),
  signatureDate: z.date(),
  communicationChannels: z.array(communicationChannelSchema).min(1),
  publishingDates: z.array(z.date()).min(1),
})

export const createRecallAdvertFromApplicationSchema = z.object({
  courtDistrictId: z.uuid(),
  settlementName: z.string(),
  settlementNationalId: z.string(),
  settlementAddress: z.string(),
  settlementDeadlineDate: z.date().nullable().optional(),
  settlementDateOfDeath: z.date().optional().nullable(),
  liquidatorLocation: z.string(),
  signatureName: z.string(),
  signatureDate: z.date(),
  signatureLocation: z.string(),
  signatureOnBehalfOf: z.string().nullable().optional(),
  divisionMeetingLocation: z.string().optional().nullable(),
  divisionMeetingDate: z.date().optional().nullable(),
  judgementDate: z.date(),
})
