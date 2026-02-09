import Kennitala from 'kennitala'
import { useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type Props = {
  onChange: (value: string) => void
}

export const CreateAdvertApplicant = ({ onChange }: Props) => {
  const trpc = useTRPC()
  const [val, setVal] = useState('')
  const [error, setError] = useState(false)

  const [name, setName] = useState('')

  const { mutate, isPending } = useMutation(
    trpc.getLegalEntityNameByNationalId.mutationOptions({
      onSuccess: (data) => {
        onChange(val)
        setName(data)
      },
      onError: (_err, variables) => {
        setVal(variables.nationalId)
        onChange(variables.nationalId)
      },
    }),
  )

  const handleChange = (nationalId: string) => {
    setVal(nationalId)
    if (nationalId.length !== 10) setName('')
    if (error) setError(false)
    if (Kennitala.isValid(nationalId)) {
      return mutate({ nationalId: nationalId })
    }

    if (nationalId.length === 10) {
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
        <GridColumn span="12/12">
          <Text variant="h4">Upplýsingar um innsendanda</Text>
        </GridColumn>
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
            value={name}
            label="Nafn aðila"
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
