import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  Box,
  GridColumn,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { DatePickerController } from '../controllers/DatePickerController'
import { InputController } from '../controllers/InputController'

export const SignatureFields = () => {
  const { getValues } = useFormContext<BaseApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { debouncedUpdateApplication } = useUpdateApplication({
    id: applicationId,
    type: 'COMMON',
  })

  return (
    <Box id="signature">
      <Stack space={[1, 2]}>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              name="signature.name"
              label="Nafn undirritara"
              onChange={(val) =>
                debouncedUpdateApplication(
                  { signature: { name: val } },
                  {
                    errorMessage: 'Ekki tókst að uppfæra nafn undirritara',
                    successMessage: 'Nafn undirritara uppfært',
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              name="signature.location"
              label="Staðsetning undirritara"
              onChange={(val) =>
                debouncedUpdateApplication(
                  { signature: { location: val } },
                  {
                    errorMessage:
                      'Ekki tókst að uppfæra staðsetningu undirritara',
                    successMessage: 'Staðsetning undirritara uppfærð',
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              name="signature.onBehalfOf"
              label="F.h. undirritara"
              onChange={(val) =>
                debouncedUpdateApplication(
                  { signature: { onBehalfOf: val } },
                  {
                    errorMessage: 'Ekki tókst að uppfæra f.h. undirritara',
                    successMessage: 'f.h. undirritara uppfært',
                  },
                )
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <DatePickerController
              name="signature.date"
              label="Dagsetning undirritunar"
              onChange={(date) =>
                debouncedUpdateApplication(
                  { signature: { date: date.toISOString() } },
                  {
                    errorMessage:
                      'Ekki tókst að uppfæra dagsetningu undirritunar',
                    successMessage: 'Dagsetning undirritunar uppfærð',
                  },
                )
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </Box>
  )
}
