import z from 'zod'

export const communicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

export const communicationChannelSchemaRefined = z
  .array(communicationChannelSchema)
  .min(1, {
    message: 'Að minnsta kosti ein samskiptaleið verður að vera til staðar',
  })

export type CommunicationChannelSchema = z.infer<
  typeof communicationChannelSchema
>

export type CommunicationChannelsSchema = z.infer<
  typeof communicationChannelSchemaRefined
>
