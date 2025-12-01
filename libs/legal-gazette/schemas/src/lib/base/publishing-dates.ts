import z from 'zod'

export const publishingDatesSchema = z.array(z.iso.datetime()).optional()

export const publishingDatesSchemaRefined = z
  .array(z.iso.datetime())
  .min(1, {
    message: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
  })
  .max(3, {
    message: 'Hámark þrír birtingardagar mega vera til staðar',
  })

export const publishingDatesRecallSchemaRefined = z
  .array(z.iso.datetime())
  .refine((dates) => dates.length >= 2 && dates.length <= 3, {
    message:
      'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
  })
