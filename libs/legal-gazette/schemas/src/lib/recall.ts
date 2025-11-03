import z from 'zod'

import { baseApplicationSchema, publishingDatesSchema } from './base'

export const courtAndJudgmentFieldsSchema = z.object({
  courtDistrictId: z
    .string()
    .optional()
    .refine((id) => id && id.length > 0, {
      message: 'Staður er nauðsynlegur',
    }),
  judgmentDate: z.iso
    .datetime()
    .optional()
    .refine((date) => date !== undefined, {
      message: 'Úrskurðar dagsetning er nauðsynlegur',
    }),
})

export const settlementFieldsSchema = z.object({
  name: z.string().refine((name) => name.length > 0, {
    message: 'Nafn bús er nauðsynlegt',
  }),
  nationalId: z.string().refine((id) => id.length > 0, {
    message: 'Kennitala bús er nauðsynleg',
  }),
  address: z.string().refine((address) => address.length > 0, {
    message: 'Heimilisfang bús er nauðsynlegt',
  }),
})

export const liquidatorFieldsSchema = z.object({
  name: z.string().refine((name) => name.length > 0, {
    message: 'Nafn skiptastjóra er nauðsynlegt',
  }),
  location: z.string().refine((location) => location.length > 0, {
    message: 'Staðsetning skiptastjóra er nauðsynleg',
  }),
})

export const divisionMeetingFieldsSchema = z.object({
  meetingDate: z.iso.datetime().refine((date) => date !== undefined, {
    message: 'Fundardagur er nauðsynlegur',
  }),
  meetingLocation: z.string().refine((location) => location.length > 0, {
    message: 'Fundarstaður er nauðsynlegur',
  }),
})

export const recallBankruptcyApplicationFieldsSchema = z.object({
  type: z.literal('bankruptcy'),
  courtAndJudgmentFields: courtAndJudgmentFieldsSchema,
  settlementFields: settlementFieldsSchema.extend({
    deadlineDate: z.iso.datetime().refine((date) => date !== undefined, {
      message: 'Frestdagur bús er nauðsynlegur',
    }),
  }),
  liquidatorFields: liquidatorFieldsSchema,
  divisionMeetingFields: divisionMeetingFieldsSchema,
})

export const recallDeceasedApplicationFieldsSchema = z.object({
  courtAndJudgmentFields: courtAndJudgmentFieldsSchema,
  settlementFields: settlementFieldsSchema.extend({
    dateOfDeath: z.iso.datetime().refine((date) => date !== undefined, {
      message: 'Dánardagur bús er nauðsynlegur',
    }),
  }),
  liquidatorFields: liquidatorFieldsSchema,
  divisionMeetingFields: divisionMeetingFieldsSchema.optional(),
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
  publishingDates: z
    .array(publishingDatesSchema)
    .refine((dates) => dates.length >= 2 && dates.length <= 3, {
      message:
        'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
    }),
})

export const recallApplicationValidationSchema = recallApplicationSchema.omit({
  metadata: true,
})
