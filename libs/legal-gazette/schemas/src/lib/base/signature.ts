import { isString } from 'class-validator'
import z from 'zod'

export const signatureSchema = z.object({
  name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  date: z.iso.datetime().optional().nullable(),
  onBehalfOf: z.string().optional().nullable(),
})

// export const signatureSchemaRefined = signatureSchema.refine((schema) => {
//   const check = (val: unknown) => isString(val) && val.length > 0

//   return check(schema.name) || check(schema.location) || check(schema.date)
// }, 'Nafn, staðsetning eða dagsetning undirritunar verður að vera til staðar')

export const signatureSchemaRefined = signatureSchema.superRefine(
  ({ name, date, location }, ctx) => {
    const check = (val: unknown) => isString(val) && val.length > 0

    const pass = check(name) || check(location) || check(date)

    if (!pass) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nafn undirritunar verður að vera til staðar',
        path: ['name'],
      })

      ctx.addIssue({
        code: 'custom',
        message: 'Staðsetning undirritunar verður að vera til staðar',
        path: ['location'],
      })

      ctx.addIssue({
        code: 'custom',
        message: 'Dagsetning undirritunar verður að vera til staðar',
        path: ['date'],
      })
    }
  },
)
