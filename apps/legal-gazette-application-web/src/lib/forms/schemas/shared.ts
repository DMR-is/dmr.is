import z from 'zod'

export const formSchema = <
  T extends { applicationId: z.ZodString; caseId: z.ZodString } & z.ZodRawShape,
  K extends z.ZodRawShape,
>(
  metaSchema: z.ZodObject<T>,
  fields: z.ZodObject<K>,
) =>
  z.object({
    meta: metaSchema,
    fields: fields,
  })

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const communicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

export const publishingDateSchema = z
  .date('Dagsetning fyrir birtingu er nauðsynleg')
  .refine((d) => d >= new Date(), 'Dagsetning má ekki vera liðin')

export type CommunicationChannelSchema = z.infer<
  typeof communicationChannelSchema
>
export type PublishingDateSchema = z.infer<typeof publishingDateSchema>

export type FormSchema = z.infer<ReturnType<typeof formSchema>>
