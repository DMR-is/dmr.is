import Kennitala from 'kennitala'
import { useEffect, useState } from 'react'
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
  Select,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation } from '@tanstack/react-query'

const schema = settlementSchemaRefined.extend({
  deadlineDate: z.iso.datetime(),
})

export const requirementsStatementOptions = [
  {
    label: 'Staðsetning skiptastjóra',
    value: 'LIQUIDATOR_LOCATION',
  },
  {
    label: 'Slá inn staðsetningu',
    value: 'CUSTOM_LIQUIDATOR_LOCATION',
  },
  {
    label: 'Tölvupóstur',
    value: 'CUSTOM_LIQUIDATOR_EMAIL',
  },
]

type Settlement = z.infer<typeof schema>

const initalState: Settlement = {
  address: '',
  liquidatorLocation: '',
  liquidatorName: '',
  name: '',
  nationalId: '',
  deadlineDate: '',
  recallRequirementStatementLocation: '',
  recallRequirementStatementType:
    ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
}

type Props = {
  onChange?: (data: Settlement) => void
}

export const CreateBankruptcySettlement = ({ onChange }: Props) => {
  const trpc = useTRPC()

  const { mutate, isPending } = useMutation(
    trpc.getEntityByNationalId.mutationOptions({}),
  )

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
          onSuccess: ({ entity }) => {
            if (!entity) return
            setState((prev) => ({
              ...prev,
              address: entity.heimili,
              name: entity.nafn,
              nationalId: entity.kennitala,
            }))
          },
          onError: (_error) => {
            toast.error('Ekki tóskt að sækja upplýsingar um kennitölu')
          },
        },
      )
    }
  }

  useEffect(() => {
    onChange?.(state)
  }, [state])

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">Upplýsingar um bú</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            loading={isPending}
            size="sm"
            backgroundColor="blue"
            name="settlement.nationalId"
            label="Kennitala bús"
            onChange={(e) => onNationalIdChange(e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            locale="is"
            size="sm"
            backgroundColor="blue"
            label="Frestdagur bús"
            placeholderText=""
            name="settlement.deadlineDate"
            handleChange={(date) =>
              setState((prev) => ({
                ...prev,
                deadlineDate: date.toISOString(),
              }))
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.name"
            label="Nafn bús"
            value={state.name}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.address"
            label="Heimilisfang bús"
            value={state.address}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                address: e.target.value,
              }))
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.liquidatorName"
            label="Nafn skiptastjóra"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                liquidatorName: e.target.value,
              }))
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.liquidatorLocation"
            label="Staðsetning skiptastjóra"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                liquidatorLocation: e.target.value,
                recallRequirementStatementLocation:
                  prev.recallRequirementStatementType ===
                  ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
                    ? e.target.value
                    : prev.recallRequirementStatementLocation,
              }))
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            size="sm"
            backgroundColor="blue"
            name="settlement.recallRequirementStatementType"
            label="Kröfulýsingar"
            defaultValue={requirementsStatementOptions[0]}
            options={requirementsStatementOptions}
            onChange={(opt) => {
              if (!opt) return
              return setState((prev) => ({
                ...prev,
                recallRequirementStatementType:
                  opt.value as ApplicationRequirementStatementEnum,
                recallRequirementStatementLocation:
                  opt.value ===
                  ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
                    ? state.liquidatorLocation
                    : '',
              }))
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            name="settlement.recallRequirementStatementLocation"
            readOnly={
              state.recallRequirementStatementType ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
            }
            value={state.recallRequirementStatementLocation}
            label={
              state.recallRequirementStatementType ===
              ApplicationRequirementStatementEnum.LIQUIDATORLOCATION
                ? 'Staðsetning skiptastjóra'
                : state.recallRequirementStatementType ===
                    ApplicationRequirementStatementEnum.CUSTOMLIQUIDATORLOCATION
                  ? 'Slá inn staðsetningu'
                  : 'Tölvupóstur'
            }
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                recallRequirementStatementLocation: e.target.value,
              }))
            }
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
