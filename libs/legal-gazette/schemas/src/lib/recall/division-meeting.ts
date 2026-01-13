import { isDateString, isString } from 'class-validator'
import * as z from 'zod'

export const divisionMeetingSchema = z.object({
  meetingDate: z.string().nullable().optional(),
  meetingLocation: z.string().nullable().optional(),
})

export const divisionMeetingSchemaRefined = z.object({
  meetingDate: z.iso
    .datetime('Fundardagur er nauðsynlegur')
    .refine((date) => isDateString(date), {
      message: 'Fundardagur er nauðsynlegur',
    }),
  meetingLocation: z
    .string('Fundarstaður er nauðsynlegur')
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Fundarstaður er nauðsynlegur',
    }),
})
