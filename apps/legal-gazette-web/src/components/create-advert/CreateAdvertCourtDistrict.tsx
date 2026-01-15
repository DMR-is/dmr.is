import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Select,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useTRPC } from '../../lib/trpc/client/trpc'

type Props = {
  onChange: (data: {
    courtDistrict: { id: string; title: string; slug: string }
    judgmentDate: string
  }) => void
}

const initalState = {
  courtDistrict: {
    id: '',
    title: '',
    slug: '',
  },
  judgmentDate: '',
}

export const CreateAdvertCourtDistrict = ({ onChange }: Props) => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.getCourtDistricts.queryOptions())
  const [state, setState] = useState(initalState)

  const options = data?.courtDistricts.map((district) => ({
    label: district.title,
    value: district.id,
  }))

  const handleSelect = (id?: string) => {
    const selectedDistrict = data?.courtDistricts.find(
      (district) => district.id === id,
    )
    if (selectedDistrict) {
      const newState = {
        ...state,
        courtDistrict: {
          id: selectedDistrict.id,
          title: selectedDistrict.title,
          slug: selectedDistrict.slug,
        },
      }
      setState(newState)
      onChange(newState)
    }
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">Grunnupplýsingar</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            backgroundColor="blue"
            size="sm"
            label="Dómstóll"
            options={options}
            onChange={(opt) => handleSelect(opt?.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            locale="is"
            size="sm"
            backgroundColor="blue"
            label="Úrskurðadagur"
            placeholderText={undefined}
            handleChange={(date) => {
              setState((prev) => ({
                ...prev,
                judgmentDate: date.toISOString(),
              }))
              onChange({
                ...state,
                judgmentDate: date.toISOString(),
              })
            }}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
