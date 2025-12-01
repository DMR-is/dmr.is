import { isDateString, isString } from 'class-validator'
import z from 'zod'

export const divisionMeetingSchema = z.object({
  meetingDate: z.string().nullable().optional(),
  meetingLocation: z.string().nullable().optional(),
})

export const divisionMeetingSchemaRefined = z.object({
  meetingDate: z.iso.datetime().refine((date) => isDateString(date), {
    message: 'Fundardagur er nauðsynlegur',
  }),
  meetingLocation: z
    .string()
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Fundarstaður er nauðsynlegur',
    }),
})
