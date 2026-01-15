import { useState } from 'react'
import z from 'zod'

import { signatureSchemaRefined } from '@dmr.is/legal-gazette/schemas'
import {
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Text,
} from '@dmr.is/ui/components/island-is'

type Props = {
  onChange: (signature: z.infer<typeof signatureSchemaRefined>) => void
}

const initalState = {
  name: '',
  location: '',
  signatureDate: '',
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
            value={state.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            label="Staðsetning undirritunar"
            name="signature-location"
            value={state.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            size="sm"
            appearInline={false}
            backgroundColor="blue"
            label="Dagsetning undirritunar"
            name="signature-signature-date"
            placeholderText={undefined}
            selected={new Date(state.signatureDate)}
            handleChange={(date) =>
              handleChange('signatureDate', date.toISOString())
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            size="sm"
            backgroundColor="blue"
            label="Fyrir hönd"
            name="signature-on-behalf-of"
            value={state.onBehalfOf}
            onChange={(e) => handleChange('onBehalfOf', e.target.value)}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
