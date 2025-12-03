import { isString } from 'class-validator'
import Kennitala from 'kennitala'
import z from 'zod'

import { ApplicationRequirementStatementEnum } from '../constants'

export const settlementSchema = z.object({
  name: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  liquidatorName: z.string().optional().nullable(),
  liquidatorLocation: z.string().optional().nullable(),
  recallRequirementStatementType: z
    .enum(ApplicationRequirementStatementEnum)
    .optional()
    .nullable(),
  recallRequirementStatementLocation: z.string().optional().nullable(),
})

export const settlementSchemaRefined = z.object({
  name: z
    .string('Nafn bús er nauðsynlegt')
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn bús er nauðsynlegt',
    }),
  nationalId: z
    .string('Kennitala bús er nauðsynleg')
    .refine((nationalId) => Kennitala.isValid(nationalId), {
      message: 'Kennitala bús er nauðsynleg',
    }),
  address: z
    .string('Heimilisfang bús er nauðsynlegt')
    .refine((address) => isString(address) && address.length > 0, {
      message: 'Heimilisfang bús er nauðsynlegt',
    }),
  liquidatorName: z
    .string('Nafn skiptastjóra er nauðsynlegt')
    .refine((name) => isString(name) && name.length > 0, {
      message: 'Nafn skiptastjóra er nauðsynlegt',
    }),
  liquidatorLocation: z
    .string('Staðsetning skiptastjóra er nauðsynleg')
    .refine((location) => isString(location) && location.length > 0, {
      message: 'Staðsetning skiptastjóra er nauðsynleg',
    }),
  recallRequirementStatementType: z.enum(ApplicationRequirementStatementEnum, {
    error: 'Sendingarmáti kröfulýsingar er nauðsynlegur',
  }),
  recallRequirementStatementLocation: z
    .string('Staðsetning kröfulýsingar er nauðsynleg')
    .min(1, { error: 'Staðsetning kröfulýsingar er nauðsynleg' }),
})
