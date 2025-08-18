import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const CommonSignatureFields = () => {
  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Undirritun</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name="fields.signatureName"
            label="Undirskrift"
            required
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <InputController
            name="fields.signatureLocation"
            label="Staðsetning undirskriftar"
            required
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name="fields.signatureDate"
            label="Dagsetning undirskriftar"
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
