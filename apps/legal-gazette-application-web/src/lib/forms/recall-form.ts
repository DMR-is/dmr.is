import { UseFormProps } from 'react-hook-form'

import {
  RecallFormFieldsSchema,
  RecallFormSchema,
  recallFormSchema,
} from './schemas/recall-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  courtOptions: { label: string; value: string }[]
  fields: Partial<RecallFormFieldsSchema>
}

export const recallForm = ({
  caseId,
  applicationId,
  courtOptions,
  fields,
}: Params): UseFormProps<RecallFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(recallFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      courtOptions,
    },
    fields: {
      ...fields,
    },
  },
})
