import addDays from 'date-fns/addDays'
import { UseFormProps } from 'react-hook-form'

import {
  BankruptcyFormSchema,
  bankruptcyFormSchema,
} from './schemas/recall-schema'

import { zodResolver } from '@hookform/resolvers/zod'

type Params = {
  caseId: string
  applicationId: string
  courtOptions: { label: string; value: string }[]
  fields: {
    advert: Partial<BankruptcyFormSchema['advert']>
    settlement: Partial<BankruptcyFormSchema['settlement']>
    liquidator: Partial<BankruptcyFormSchema['liquidator']>
    publishing: Partial<BankruptcyFormSchema['publishing']>
    divisionMeeting: Partial<BankruptcyFormSchema['divisionMeeting']>
    signature: Partial<BankruptcyFormSchema['signature']>
  }
}

export const recallForm = ({
  caseId,
  applicationId,
  courtOptions,
  fields,
}: Params): UseFormProps<BankruptcyFormSchema> => ({
  mode: 'onChange',
  resolver: zodResolver(bankruptcyFormSchema),
  defaultValues: {
    meta: {
      caseId,
      applicationId,
      courtOptions,
    },
    ...fields,
  },
})
