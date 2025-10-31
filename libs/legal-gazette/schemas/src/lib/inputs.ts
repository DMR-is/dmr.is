import z from 'zod'

import {
  communicationChannelSchema,
  publishingDatesSchema,
  strictSignatureSchema,
} from './base'
import { commonApplicationFieldsScehma } from './common'
import {
  courtAndJudgmentFieldsSchema,
  divisionMeetingFieldsSchema,
  liquidatorFieldsSchema,
  settlementFieldsSchema,
} from './recall'

export const recallUpdateApplicationSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentFieldsSchema.partial().optional(),
  settlementFields: settlementFieldsSchema
    .extend({
      deadlineDate: z.iso.datetime().optional(),
      dateOfDeath: z.iso.datetime().optional(),
    })
    .partial()
    .optional(),
  liquidatorFields: liquidatorFieldsSchema.partial().optional(),
  divisionMeetingFields: divisionMeetingFieldsSchema.partial().optional(),
})

export const updateApplicationSchema = z.object({
  additionalText: z.string().optional(),
  commonFields: commonApplicationFieldsScehma.partial().optional(),
  recallFields: recallUpdateApplicationSchema.partial().optional(),
  signature: strictSignatureSchema.partial().optional(),
  publishingDates: z.array(publishingDatesSchema).optional(),
  communicationChannels: z.array(communicationChannelSchema).optional(),
})
