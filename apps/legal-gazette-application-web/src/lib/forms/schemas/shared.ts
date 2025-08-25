import z from 'zod'

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
