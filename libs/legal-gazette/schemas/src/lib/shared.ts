import z from 'zod'

export const baseEntitySchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
})

export const communicationChannelSchema = z.object({
  email: z.email(),
  name: z.string().optional(),
  phone: z.string().optional(),
})

export const signatureSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.date().optional(),
  onBehalfOf: z.string().optional(),
})

export const publishingDatesSchema = z.object({
  publishingDate: z.date(),
})

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const applicationMetaDataSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
  typeOptions: z.array(optionSchema),
  courtDistrictOptions: z.array(optionSchema),
})
