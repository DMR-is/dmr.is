import { useState } from 'react'
import z from 'zod'

import { signatureSchemaRefined } from '@dmr.is/legal-gazette/schemas'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'

type Signature = z.infer<typeof signatureSchemaRefined>

type Props = {
  onChange: (signature: Signature) => void
}

const initalState: Signature = {
  name: '',
  location: '',
  date: '',
  onBehalfOf: '',
}

export const CreateAdvertSignature = ({ onChange }: Props) => {
  const [state, setState] = useState(initalState)

  const handleChange = (key: keyof typeof initalState, value: string) => {
    const newState = { ...state, [key]: value }
    setState(newState)
    onChange(newState)
  }

  return (
    <GridContainer>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">Undirritun</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            label="Nafn undirritunar"
            name="signature-name"
            value={state.name ?? ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            label="Staðsetning undirritunar"
            name="signature-location"
            value={state.location ?? ''}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            size="sm"
            locale="is"
            appearInline={false}
            backgroundColor="blue"
            label="Dagsetning undirritunar"
            name="signature-signature-date"
            placeholderText={undefined}
            selected={state.date ? new Date(state.date) : undefined}
            handleChange={(date) => handleChange('date', date.toISOString())}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            label="Fyrir hönd"
            name="signature-on-behalf-of"
            value={state.onBehalfOf ?? ''}
            onChange={(e) => handleChange('onBehalfOf', e.target.value)}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
