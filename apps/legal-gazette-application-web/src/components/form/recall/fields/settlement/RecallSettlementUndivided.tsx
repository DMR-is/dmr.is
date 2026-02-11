import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { InputController } from '../../../controllers/InputController'
import { RecallSettlementDefault } from './RecallSettlementDefault'

export const RecallSettlementUndivided = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()

  const metadata = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
    id: metadata.applicationId,
    type: 'RECALL',
  })

  return (
    <Stack space={[2, 3]}>
      <RecallSettlementDefault />
      <Stack space={[2, 3]}>
        <GridRow rowGap={2}>
          <GridColumn span="12/12">
            <Text variant="h4">Upplýsingar um maka</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              label="Kennitala maka"
              name={'fields.settlementFields.partnerNationalId'}
              onChange={(val) =>
                // Save to localStorage only - server sync happens on navigation
                updateLocalOnly({
                  fields: {
                    settlementFields: {
                      partnerNationalId: val,
                    },
                  },
                })
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              label="Nafn maka"
              name={'fields.settlementFields.partnerName'}
              onChange={(val) =>
                // Save to localStorage only - server sync happens on navigation
                updateLocalOnly({
                  fields: {
                    settlementFields: {
                      partnerName: val,
                    },
                  },
                })
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </Stack>
  )
}
