'use client'
import Kennitala from 'kennitala'
import { useState } from 'react'

import {
  AlertMessage,
  GridContainer,
  GridRow,
  Input,
} from '@dmr.is/ui/components/island-is'

import { GridColumn } from '@island.is/island-ui/core'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type Props = {
  onChange: (value: string) => void
}

export const CreateAdvertApplicant = ({ onChange }: Props) => {
  const trpc = useTRPC()
  const [val, setVal] = useState('')
  const [error, setError] = useState(false)

  const { mutate, data, isPending } = useMutation(
    trpc.getPersonByNationalId.mutationOptions({
      onSuccess: (data) => {
        onChange(data.person?.nafn || '')
      },
    }),
  )

  const handleChange = (val: string) => {
    setVal(val)
    if (error) setError(false)
    if (Kennitala.isValid(val)) {
      return mutate({ nationalId: val })
    }

    if (val.length === 10) {
      setError(true)
    }
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        {error && (
          <GridColumn span="12/12">
            <AlertMessage
              type="error"
              title="Aðili fannst ekki"
              message="Ekki tókst að finna aðila með þessa kennitölu"
            />
          </GridColumn>
        )}
        <GridColumn span={['12/12', '6/12']}>
          <Input
            loading={isPending}
            size="sm"
            backgroundColor="blue"
            name="applicant-national-id"
            label="Kennitala fyrir hönd innsendanda"
            required
            maxLength={10}
            value={val}
            onChange={(e) => handleChange(e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            readOnly
            size="sm"
            name="person.name"
            value={data?.person?.nafn}
            label="Nafn aðila"
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
