import { isDateString, isString } from 'class-validator'
import * as z from 'zod'

export const divisionMeetingSchema = z.object({
  meetingDate: z.string().nullable().optional(),
  meetingLocation: z.string().nullable().optional(),
})

export const divisionMeetingSchemaRefined = z.object({
  meetingDate: z.iso
    .datetime('Dagsetning skiptafundar er nauðsynleg')
    .refine((date) => isDateString(date), {
      message: 'Dagsetning skiptafundar er nauðsynleg',
    }),
  meetingLocation: z
    .string('Staðsetning skiptafundar er nauðsynleg')
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Staðsetning skiptafundar er nauðsynleg',
    }),
})
