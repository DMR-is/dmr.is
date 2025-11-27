import z from 'zod'

import { communicationChannelSchema, signatureSchema } from './base'
import { commonApplicationFieldsSchema } from './common'
import {
  recallBankruptcyApplicationFieldsSchema,
  recallDeceasedApplicationFieldsSchema,
} from './recall'

export const updateApplicationBaseAnswers = z.object({
  additionalText: z.string().optional(),
  signature: signatureSchema.partial().optional(),
  publishingDates: z.array(z.iso.datetime()).optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const updateApplicationSchema = z.discriminatedUnion('type', [
  updateApplicationBaseAnswers.extend({
    type: z.literal('COMMON'),
    answers: commonApplicationFieldsSchema.partial().optional(),
  }),
  updateApplicationBaseAnswers.extend({
    type: z.literal('RECALL_BANKRUPTCY'),
    answers: recallBankruptcyApplicationFieldsSchema.partial().optional(),
  }),
  updateApplicationBaseAnswers.extend({
    type: z.literal('RECALL_DECEASED'),
    answers: recallDeceasedApplicationFieldsSchema.partial().optional(),
  }),
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
