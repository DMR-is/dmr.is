import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  Box,
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../hooks/useUpdateApplicationJson'
import { DatePickerController } from '../controllers/DatePickerController'
import { InputController } from '../controllers/InputController'

export const SignatureFields = () => {
  const { getValues, formState } = useFormContext<BaseApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { debouncedUpdateApplicationJson } = useUpdateApplicationJson({
    id: applicationId,
    type: 'COMMON',
  })

  const signatureError = formState.errors.signature

  return (
    <Box id="signature">
      <Stack space={[1, 2]}>
        <Text variant="h4">Undirritun</Text>
        {signatureError && (
          <AlertMessage
            type="error"
            title="Fylla þarf út undirritun"
            message={signatureError.message}
          />
        )}
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <InputController
              name="signature.name"
              label="Nafn undirritara"
              onChange={(val) =>
                debouncedUpdateApplicationJson(
                  { signature: { name: val } },
                  {
                    errorMessage: 'Villa við að uppfæra nafn undirritara',
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
                debouncedUpdateApplicationJson(
                  { signature: { location: val } },
                  {
                    errorMessage:
                      'Villa við að uppfæra staðsetningu undirritara',
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
                debouncedUpdateApplicationJson(
                  { signature: { onBehalfOf: val } },
                  {
                    errorMessage: 'Villa við að uppfæra f.h. undirritara',
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
                debouncedUpdateApplicationJson(
                  { signature: { date: date.toISOString() } },
                  {
                    errorMessage:
                      'Villa við að uppfæra dagsetningu undirritunar',
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
