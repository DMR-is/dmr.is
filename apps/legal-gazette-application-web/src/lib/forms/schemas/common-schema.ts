import { z } from 'zod'

import {
  communicationChannelSchema,
  optionSchema,
  publishingDateSchema,
} from './shared'

export const commonFormMetaSchema = z.object({
  caseId: z.string(),
  applicationId: z.string(),
  typeOptions: z.array(optionSchema),
})

export const commonFormFieldsSchema = z.object({
  type: z.string().min(1, 'Tegund er nauðsynleg').optional(),
  category: z.string().min(1, 'Flokkur er nauðsynlegur'),
  caption: z.string().min(1, 'Yfirskrift er nauðsynleg'),
  html: z.string().min(1, 'Meginmál er nauðsynlegt'),
  signatureName: z.string().min(1, 'Undirskrift er nauðsynleg'),
  signatureLocation: z
    .string()
    .min(1, 'Staðsetning undirskriftar er nauðsynleg'),
  signatureDate: z.date('Dagsetning undirskriftar er nauðsynleg'),
  publishingDates: z
    .array(publishingDateSchema)
    .refine(
      (dates) => dates.length > 0,
      'Að minnsta kosti ein dagsetning fyrir birtingu er nauðsynleg',
    ),
  communicationChannels: z
    .array(communicationChannelSchema)
    .refine(
      (val) => val.length > 0,
      'Að minnsta kosti ein samskiptaleið er nauðsynleg',
    ),
})

export const commonFormSchema = z.object({
  meta: commonFormMetaSchema,
  fields: commonFormFieldsSchema,
})

export type CommonFormMetaSchema = z.infer<typeof commonFormMetaSchema>

export type CommonFormSchema = z.infer<typeof commonFormSchema>

export enum CommonFormFields {
  TYPE = 'fields.type',
  CATEGORY = 'fields.category',
  CAPTION = 'fields.caption',
  HTML = 'fields.html',
  SIGNATURE_NAME = 'fields.signatureName',
  SIGNATURE_LOCATION = 'fields.signatureLocation',
  SIGNATURE_DATE = 'fields.signatureDate',
  PUBLISHING_DATES = 'fields.publishingDates',
}
