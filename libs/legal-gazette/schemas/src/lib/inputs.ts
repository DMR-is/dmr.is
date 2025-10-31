import z from 'zod'

import {
  communicationChannelSchema,
  publishingDatesSchema,
  strictSignatureSchema,
} from './base'
import { commonApplicationFieldsScehma } from './common'

export const courtAndJudgmentFieldsInput = z.object({
  courtDistrictId: z.string().optional(),
  judgmentDate: z.iso.datetime().optional(),
})

const settlementFieldsInput = z.object({
  name: z.string().optional(),
  nationalId: z.string().optional(),
  address: z.string().optional(),
})

const liquidatorFieldsInput = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
})

const divisionMeetingFieldsInput = z.object({
  meetingDate: z.iso.datetime().optional(),
  meetingLocation: z.string().optional(),
})

export const recallUpdateApplicationSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentFieldsInput.optional(),
  settlementFields: settlementFieldsInput
    .extend({
      deadlineDate: z.iso.datetime().optional(),
      dateOfDeath: z.iso.datetime().optional(),
    })
    .optional(),
  liquidatorFields: liquidatorFieldsInput.partial().optional(),
  divisionMeetingFields: divisionMeetingFieldsInput.partial().optional(),
})

export const updateApplicationSchema = z.object({
  additionalText: z.string().optional(),
  commonFields: commonApplicationFieldsScehma.partial().optional(),
  recallFields: recallUpdateApplicationSchema.partial().optional(),
  signature: strictSignatureSchema.partial().optional(),
  publishingDates: z.array(publishingDatesSchema).optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const addDivisionMeetingInputSchema = z.object({
  applicationId: z.string(),
  meetingDate: z.iso.datetime(),
  meetingLocation: z.string(),
  signature: strictSignatureSchema,
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})

export const addDivisionEndingInputSchema = z.object({
  applicationId: z.string(),
  additionalText: z.string().optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
  signature: strictSignatureSchema,
  scheduledAt: z.iso.datetime(),
  declaredClaims: z.number(),
})
