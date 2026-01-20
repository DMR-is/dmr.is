import { isDateString } from 'class-validator'
import Kennitala from 'kennitala'
import { useEffect, useState } from 'react'
import z from 'zod'

import {
  ApplicationRequirementStatementEnum,
  companySchema,
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
import { CreateDeceasedCompanies } from './CreateDeceasedCompanies'

import { useMutation } from '@tanstack/react-query'

const schema = settlementSchemaRefined.extend({
  dateOfDeath: z.iso
    .datetime('Dánardagur bús er nauðsynlegur')
    .refine((date) => isDateString(date), {
      message: 'Dánardagur bús er nauðsynlegur',
    }),
  companies: z.array(companySchema).optional(),
  type: z.enum(['DEFAULT', 'UNDIVIDED', 'OWNER']).optional(),
})

const requirementsStatementOptions = [
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

const settlementTypeOptions = [
  {
    label: 'Hefðbundið dánarbú',
    value: 'DEFAULT',
  },
  {
    label: 'Óskipt dánarbú',
    value: 'UNDIVIDED',
  },
  {
    label: 'Eiganda samlagsfélags',
    value: 'OWNER',
  },
]

type Settlement = z.infer<typeof schema>

const initalState: Settlement = {
  address: '',
  liquidatorLocation: '',
  liquidatorName: '',
  name: '',
  nationalId: '',
  dateOfDeath: '',
  recallRequirementStatementLocation: '',
  recallRequirementStatementType:
    ApplicationRequirementStatementEnum.LIQUIDATORLOCATION,
  companies: [],
  type: 'DEFAULT',
}

type Props = {
  onChange?: (data: Settlement) => void
}

export const CreateDeceasedSettlement = ({ onChange }: Props) => {
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
          <Text marginBottom={[2, 3]} variant="h4">
            Upplýsingar um bú
          </Text>
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn paddingBottom={[2, 3]}>
          <Select
            size="sm"
            backgroundColor="blue"
            name="settlement.type"
            label="Tegund bús"
            defaultValue={settlementTypeOptions[0]}
            options={settlementTypeOptions}
            onChange={(opt) => {
              if (!opt) return
              return setState((prev) => ({
                ...prev,
                type: opt.value as 'DEFAULT' | 'UNDIVIDED' | 'OWNER',
                companies: [],
              }))
            }}
          />
        </GridColumn>
      </GridRow>
      <GridRow rowGap={[2, 3]}>
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
            label="Dánardagur bús"
            placeholderText=""
            name="settlement.dateOfDeath"
            handleChange={(date) =>
              setState((prev) => ({
                ...prev,
                dateOfDeath: date.toISOString(),
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
        {state.type === 'OWNER' && (
          <GridColumn span="12/12">
            <CreateDeceasedCompanies
              onChange={(companies) =>
                setState((prev) => ({ ...prev, companies: companies }))
              }
            />
          </GridColumn>
        )}
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
