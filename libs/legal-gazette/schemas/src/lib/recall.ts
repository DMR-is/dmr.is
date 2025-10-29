import z from 'zod'

import { baseApplicationSchema, baseFieldsSchema } from './base'
import { RecallApplicationInputFields } from './constants'

export const courtAndJudgmentFieldsSchema = z.object({
  courtDistrictId: z.string().refine((id) => id.length > 0, {
    path: [RecallApplicationInputFields.COURT_DISTRICT_ID],
    message: 'Staður er nauðsynlegur',
  }),
  judgementDate: z.iso.datetime().refine((date) => date !== undefined, {
    path: [RecallApplicationInputFields.JUDGEMENT_DATE],
    message: 'Úrskurðar dagsetning er nauðsynlegur',
  }),
})

export const settlementFieldsSchema = z.object({
  name: z.string().refine((name) => name.length > 0, {
    path: [RecallApplicationInputFields.SETTLEMENT_NAME],
    message: 'Nafn bús er nauðsynlegt',
  }),
  nationalId: z.string().refine((id) => id.length > 0, {
    path: [RecallApplicationInputFields.SETTLEMENT_NATIONAL_ID],
    message: 'Kennitala bús er nauðsynleg',
  }),
  address: z.string().refine((address) => address.length > 0, {
    path: [RecallApplicationInputFields.SETTLEMENT_ADDRESS],
    message: 'Heimilisfang bús er nauðsynlegt',
  }),
})

export const liquidatorFieldsSchema = z.object({
  name: z.string().refine((name) => name.length > 0, {
    path: [RecallApplicationInputFields.LIQUIDATOR_NAME],
    message: 'Nafn skiptastjóra er nauðsynlegt',
  }),
  location: z.string().refine((location) => location.length > 0, {
    path: [RecallApplicationInputFields.LIQUIDATOR_LOCATION],
    message: 'Staðsetning skiptastjóra er nauðsynleg',
  }),
})

export const divisionMeetingFieldsSchema = z.object({
  meetingDate: z.iso.datetime().refine((date) => date !== undefined, {
    path: [RecallApplicationInputFields.DIVISION_MEETING_DATE],
    message: 'Fundardagur er nauðsynlegur',
  }),
  meetingLocation: z.string().refine((location) => location.length > 0, {
    path: [RecallApplicationInputFields.DIVISION_MEETING_LOCATION],
    message: 'Fundarstaður er nauðsynlegur',
  }),
})

export const recallBankruptcyApplicationFieldsSchema = baseFieldsSchema.extend({
  type: z.literal('bankruptcy'),
  courtAndJudgment: courtAndJudgmentFieldsSchema,
  settlement: settlementFieldsSchema.extend({
    deadlineDate: z.iso.datetime().refine((date) => date !== undefined, {
      path: [RecallApplicationInputFields.SETTLEMENT_DEADLINE_DATE],
      message: 'Frestdagur bús er nauðsynlegur',
    }),
  }),
  liquidator: liquidatorFieldsSchema,
  divisionMeeting: divisionMeetingFieldsSchema,
})

export const recallDeceasedApplicationFieldsSchema = baseFieldsSchema.extend({
  courtAndJudgment: courtAndJudgmentFieldsSchema,
  settlement: settlementFieldsSchema.extend({
    dateOfDeath: z.iso.datetime().refine((date) => date !== undefined, {
      path: [RecallApplicationInputFields.SETTLEMENT_DATE_OF_DEATH],
      message: 'Dánardagur bús er nauðsynlegur',
    }),
  }),
  liquidator: liquidatorFieldsSchema,
  divisionMeeting: divisionMeetingFieldsSchema.optional(),
})

export const recallApplicationFieldsSchema = z.discriminatedUnion('type', [
  recallBankruptcyApplicationFieldsSchema.extend({
    type: z.literal('RECALL_BANKRUPTCY'),
  }),
  recallDeceasedApplicationFieldsSchema.extend({
    type: z.literal('RECALL_DECEASED'),
  }),
])

export const recallApplicationSchema = baseApplicationSchema.extend({
  fields: recallApplicationFieldsSchema,
})
