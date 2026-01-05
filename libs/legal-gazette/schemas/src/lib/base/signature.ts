import { isString } from 'class-validator'
import z from 'zod'

export const signatureSchema = z.object({
  name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  date: z.iso.datetime().optional().nullable(),
  onBehalfOf: z.string().optional().nullable(),
})

export const signatureSchemaRefined = signatureSchema.refine((schema) => {
  const check = (val: unknown) => isString(val) && val.length > 0

  return check(schema.name) || check(schema.location) || check(schema.date)
}, 'Nafn, staðsetning eða dagsetning undirritunar verður að vera til staðar')
