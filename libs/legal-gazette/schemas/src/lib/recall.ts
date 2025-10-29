import z from 'zod'

import { baseApplicationSchema, baseFieldsSchema } from './base'

export const courtAndJudgmentFieldsSchema = z.object({
  courtDistrictId: z.string(),
  judgementDate: z.iso.datetime(),
})

export const settlementFieldsSchema = z.object({
  name: z.string(),
  nationalId: z.string(),
  address: z.string(),
  deadlineDate: z.iso.datetime().optional(),
  dateOfDeath: z.iso.datetime().optional(),
})

export const liquidatorFieldsSchema = z.object({
  name: z.string(),
  location: z.string(),
})

export const divisionMeetingFieldsSchema = z.object({
  meetingDate: z.iso.datetime().optional(),
  meetingLocation: z.string().optional(),
})

export const recallApplicationFieldsSchema = baseFieldsSchema.extend({
  courtAndJudgment: courtAndJudgmentFieldsSchema.optional(),
  settlement: settlementFieldsSchema,
  liquidator: liquidatorFieldsSchema,
  divisionMeeting: divisionMeetingFieldsSchema.optional(),
})

export const recallApplicationSchema = baseApplicationSchema.extend({
  fields: recallApplicationFieldsSchema,
})
