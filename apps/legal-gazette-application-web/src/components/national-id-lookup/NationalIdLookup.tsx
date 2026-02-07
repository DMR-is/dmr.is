'use client'

import Kennitala from 'kennitala'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

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
  onChange: (nationalId: string) => void
}

export const NationalIdLookup = ({
  defaultValue = '',
  onSuccessfulLookup,
  onReset,
  onError: setErrorMessage,
  onChange,
}: Props) => {
  const trpc = useTRPC()
  const { formState, clearErrors } =
    useFormContext<RecallApplicationWebSchema>()
  const { mutate, isPending } = useMutation(
    trpc.getEntityByNationalId.mutationOptions({
      onMutate: () => {
        setErrorMessage?.(null)
      },
      onSuccess: ({ entity }) => {
        if (entity === null) {
          toast.error('Ekkert fannst fyrir gefna kennitölu', {
            toastId: 'national-id-lookup-fail',
          })
          setNationalId('')
          return
        }

        onSuccessfulLookup?.({
          nationalId: entity.kennitala,
          name: entity.nafn,
          address: entity.heimili,
          zipCode: entity.postaritun.split('-')[0],
          city: entity.sveitarfelag,
        })
      },
      onError: (_err) => {
        setErrorMessage?.({
          title: 'Ekki tókst að sækja upplýsingar fyrir kennitölu',
          message: 'Athugaðu hvort kennitala sé rétt.',
        })
      },
    }),
  )

  const [nationalId, setNationalId] = useState(defaultValue)

  const onChangeHandler = (val: string) => {
    clearErrors('fields.settlementFields.nationalId')
    onChange(val)
    setNationalId(val)
  }

  const isValidId = useMemo(() => Kennitala.isValid(nationalId), [nationalId])

  const errorMessage =
    formState.errors.fields?.settlementFields?.nationalId?.message

  useEffect(() => {
    if (isValidId && nationalId !== defaultValue) {
      mutate({ nationalId })
    }
  }, [isValidId, nationalId, mutate])

  const errorLabel =
    nationalId.length !== 10 ? '' : isValidId ? '' : 'Kennitala er ekki gild'

  return (
    <Input
      id="fields.settlementFields.nationalId"
      required
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
