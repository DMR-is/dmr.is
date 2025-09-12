'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'

export const SignatureFields = () => {
  const { advert } = useAdvertContext()

  const {
    signatureDate,
    signatureName,
    signatureLocation,
    signatureOnBehalfOf,
  } = advert

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Undirritun</Text>
        </GridColumn>
      </GridRow>
      <GridRow rowGap={[1, 2]}>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureName"
            size="sm"
            label="Nafn undirritara"
            defaultValue={signatureName}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureOnBehalfOf"
            size="sm"
            label="Fyrir hönd"
            defaultValue={signatureOnBehalfOf ?? ''}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureLocation"
            size="sm"
            label="Staður undirritunar"
            defaultValue={signatureLocation}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            name="signatureDate"
            placeholderText=""
            size="sm"
            label="Dagsetning undirritunar"
            selected={new Date(signatureDate)}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
