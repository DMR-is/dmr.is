import { UseFormProps } from 'react-hook-form'

import { CommonFormSchema, commonFormSchema } from './schemas/common-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  typeOptions?: { label: string; value: string }[]
  fields: Partial<CommonFormSchema['fields']>
}
export const commonForm = ({
  caseId,
  applicationId,
  typeOptions,
  fields,
}: Params): UseFormProps<CommonFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(commonFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      typeOptions: typeOptions,
    },
    fields,
  },
})
