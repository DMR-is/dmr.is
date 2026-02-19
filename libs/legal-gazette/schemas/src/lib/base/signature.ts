import { isString } from 'class-validator'
import * as zod from 'zod'

export const signatureSchema = zod.object({
  name: zod.string().optional().nullable(),
  location: zod.string().optional().nullable(),
  date: zod.string().optional().nullable(),
  onBehalfOf: zod.string().optional().nullable(),
})

export const signatureSchemaRefined = zod.preprocess(
  (val) => val ?? {},
  signatureSchema.refine((schema) => {
    const check = (val: unknown) => isString(val) && val.length > 0

    return check(schema.name) || check(schema.location) || check(schema.date)
  }, 'Nafn, staðsetning eða dagsetning undirritunar verður að vera til staðar'),
)
