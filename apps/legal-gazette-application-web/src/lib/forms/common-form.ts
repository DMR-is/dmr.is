import { UseFormProps } from 'react-hook-form'

import { CommonFormSchema, commonFormSchema } from './schemas/common-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  categoryOptions?: { label: string; value: string }[]
  fields: Partial<CommonFormSchema['fields']>
}
export const commonForm = ({
  caseId,
  applicationId,
  categoryOptions,
  fields,
}: Params): UseFormProps<CommonFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      categoryOptions: categoryOptions,
    },
    fields: {
      caption: fields.caption,
      category: fields.category,
      html: fields.html,
      signatureName: fields.signatureName,
      signatureLocation: fields.signatureLocation,
      signatureDate: fields.signatureDate,
      publishingDates: fields.publishingDates,
      communicationChannels: fields.communicationChannels,
    },
  },
})
