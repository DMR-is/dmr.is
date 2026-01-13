import Kennitala from 'kennitala'
import { useState } from 'react'
import z from 'zod'

import {
  ApplicationRequirementStatementEnum,
  settlementSchemaRefined,
} from '@dmr.is/legal-gazette/schemas'
import {
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

type Props = {}

const schema = settlementSchemaRefined.extend({
  deadline: z.iso.datetime(),
})

type Settlement = z.infer<typeof schema>

const initalState: Settlement = {
  address: '',
  liquidatorLocation: '',
  liquidatorName: '',
  name: '',
  nationalId: '',
  deadline: '',
  recallRequirementStatementLocation: '',
  recallRequirementStatementType:
    ApplicationRequirementStatementEnum.CUSTOMLIQUIDATOREMAIL,
}

export const CreateAdvertSettlement = () => {
  const trpc = useTRPC()

  const { mutate } = useMutation(trpc.getPersonByNationalId.mutationOptions({}))

  const [state, setState] = useState(initalState)

  const onNationalIdChange = (id: string) => {
    setState((prev) => ({
      ...prev,
      nationalId: id,
    }))
    if (Kennitala.isValid(id)) {
      mutate(
        {
          nationalId: id,
        },
        {
          onSuccess: ({ person }) => {
            if (!person) return
            setState((prev) => ({
              ...prev,
              address: person.heimili,
              name: person.nafn,
              nationalId: person.kennitala,
            }))
          },
          onError: (_error) => {
            toast.error('Ekki tóskt að sækja upplýsingar um kennitölu')
          },
        },
      )
    }
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">Upplýsingar um bú</Text>
        </GridColumn>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.nationalId"
            label="Kennitala bús"
            onChange={(e) => onNationalIdChange(e.target.value)}
          />
        </GridColumn>
        <GridColumn span="6/12">
          <DatePicker
            size="sm"
            backgroundColor="blue"
            label="Frestdagur bús"
            placeholderText=""
            name="settlement.deadlineDate"
            handleChange={(date) =>
              setState((prev) => ({
                ...prev,
                deadline: date.toISOString(),
              }))
            }
          />
        </GridColumn>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.name"
            label="Nafn bús"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </GridColumn>
        <GridColumn span="6/12">
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.address"
            label="Heimilisfang bús"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                address: e.target.value,
              }))
            }
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
