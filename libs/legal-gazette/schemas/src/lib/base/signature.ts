import { isString } from 'class-validator'
import z from 'zod'

export const signatureSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.iso.datetime().optional(),
  onBehalfOf: z.string().optional(),
})

export const signatureSchemaRefined = signatureSchema.refine((schema) => {
  const check = (val: unknown) => isString(val) && val.length > 0

  return check(schema.name) || check(schema.location) || check(schema.date)
}, 'Nafn, staðsetning eða dagsetning undirritunar verður að vera til staðar')
