import z from 'zod'

import { communicationChannelSchema, signatureSchema } from './base'
import { commonApplicationSchema } from './common'
import {
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
} from './recall'

export const updateApplicationSchema = z.discriminatedUnion('type', [
  commonApplicationSchema,
  recallBankruptcyApplicationSchema,
  recallDeceasedApplicationSchema,
])

export const addDivisionMeetingInputSchema = z.object({
  applicationId: z.string(),
  meetingDate: z.iso.datetime(),
  meetingLocation: z.string(),
  signature: signatureSchema,
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const addDivisionEndingInputSchema = z.object({
  applicationId: z.string(),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: signatureSchema,
  scheduledAt: z.iso.datetime(),
  declaredClaims: z.number(),
})
