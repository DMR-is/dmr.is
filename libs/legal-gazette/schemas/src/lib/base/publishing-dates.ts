import z from 'zod'

export const publishingDatesSchema = z.array(z.iso.datetime()).optional()

export const publishingDatesSchemaRefined = z
  .array(z.iso.datetime(), {
    error: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
  })
  .min(1, {
    error: 'Að minnsta kosti einn birtingardagur verður að vera til staðar',
  })
  .max(3, {
    error: 'Hámark þrír birtingardagar mega vera til staðar',
  })

export const publishingDatesRecallSchemaRefined = z
  .array(z.iso.datetime(), {
    error: 'Að minnsta kosti tveir birtingardagar verða að vera til staðar',
  })
  .min(2, {
    error: 'Að minnsta kosti tveir birtingardagar verða að vera til staðar',
  })
  .refine((dates) => dates.length >= 2 && dates.length <= 3, {
    message:
      'Að minnsta kosti tveir og mest þrír birtingardagar verða að vera til staðar',
  })
