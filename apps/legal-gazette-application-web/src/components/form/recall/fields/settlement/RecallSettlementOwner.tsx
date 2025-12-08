'use client'

import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'

import { NationalIdLookup } from '../../../../national-id-lookup/NationalIdLookup'

export const RecallSettlementOwner = () => {
  const { getValues, setValue } = useFormContext<RecallApplicationWebSchema>()

  return (
    <NationalIdLookup
      defaultValue={getValues('fields.settlementFields.nationalId') ?? ''}
      // onSuccessfulLookup={onSuccessfulLookup}
      // onReset={resetLookupFields}
      // onError={setOnLookupError}
    />
  )
}
