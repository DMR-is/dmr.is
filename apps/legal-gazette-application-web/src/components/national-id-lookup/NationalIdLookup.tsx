'use client'

import Kennitala from 'kennitala'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Input, toast } from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

export type NationalIdLookupResults = {
  nationalId: string
  name: string
  address: string
  zipCode: string
  city: string
}

type Props = {
  defaultValue?: string
  onSuccessfulLookup?: (results: NationalIdLookupResults) => void
  onReset?: () => void
  onError?: (error: { title: string; message: string } | null) => void
}

export const NationalIdLookup = ({
  defaultValue = '',
  onSuccessfulLookup,
  onReset,
  onError: setErrorMessage,
}: Props) => {
  const trpc = useTRPC()
  const { formState, clearErrors } =
    useFormContext<RecallApplicationWebSchema>()
  const { mutate, isPending } = useMutation(
    trpc.getPersonByNationalId.mutationOptions({
      onMutate: () => {
        setErrorMessage?.(null)
      },
      onSuccess: ({ person }) => {
        if (person === null) {
          toast.error('Ekkert fannst fyrir gefna kennitölu', {
            toastId: 'national-id-lookup-fail',
          })
          setNationalId('')
          return
        }

        onSuccessfulLookup?.({
          nationalId: person.kennitala,
          name: person.nafn,
          address: person.heimili,
          zipCode: person.postaritun.split('-')[0],
          city: person.sveitarfelag,
        })
      },
      onError: (_err) => {
        setErrorMessage?.({
          title: 'Ekki tókst að sækja upplýsingar fyrir kennitölu',
          message: 'Athugaðu hvort kennitala sé rétt.',
        })
        onReset?.()
      },
    }),
  )
  const [nationalId, setNationalId] = useState(defaultValue)

  const onChangeHandler = (val: string) => {
    clearErrors('fields.settlementFields.nationalId')
    setNationalId(val)
  }

  const isValidId = useMemo(() => Kennitala.isValid(nationalId), [nationalId])

  const errorMessage =
    formState.errors.fields?.settlementFields?.nationalId?.message

  useEffect(() => {
    if (isValidId) {
      mutate({ nationalId })
    }
  }, [isValidId, nationalId, mutate])

  const errorLabel =
    nationalId.length !== 10 ? '' : isValidId ? '' : 'Kennitala er ekki gild'

  return (
    <Input
      id="fields.settlementFields.nationalId"
      readOnly={isValidId}
      size="sm"
      backgroundColor="blue"
      loading={isPending}
      label="Kennitala"
      placeholder="Sláðu inn kennitölu"
      maxLength={10}
      errorMessage={errorLabel || errorMessage}
      name="fields.settlementFields.nationalId"
      value={nationalId}
      onChange={(e) => onChangeHandler(e.target.value)}
      buttons={[
        {
          name: 'close',
          label: 'Hreinsa',
          onClick: () => {
            setNationalId('')
            onReset?.()
            setErrorMessage?.(null)
          },
          type: 'outline',
        },
      ]}
    />
  )
}
