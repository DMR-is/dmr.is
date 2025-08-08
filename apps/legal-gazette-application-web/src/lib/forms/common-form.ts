type Params = { caseId: string; applicationId: string }
import { UseFormProps } from 'react-hook-form'

import {
  DeceasedFormSchema,
  deceasedFormSchema,
} from './schemas/deceased-schema'

import { zodResolver } from '@hookform/resolvers/zod'

export const deceasedForm = ({
  caseId,
  applicationId,
}: Params): UseFormProps<DeceasedFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(deceasedFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
    },
  },
})
