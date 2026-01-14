import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  Box,
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { DatePickerController } from '../controllers/DatePickerController'
import { InputController } from '../controllers/InputController'

export const SignatureFields = () => {
  const {
    getValues,
    clearErrors,
    formState: { errors },
  } = useFormContext<BaseApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { debouncedUpdateApplication } = useUpdateApplication({
    id: applicationId,
    type: 'COMMON',
  })

  const onChangeHandler = (
    key: 'date' | 'name' | 'location' | 'onBehalfOf',
    value: string,
  ) => {
    clearErrors('signature')

    debouncedUpdateApplication(
      { signature: { [key]: value } },
      {
        errorMessage: 'Ekki tókst að uppfæra undirritun',
        successMessage: 'Undirritun uppfærð',
      },
    )
  }

  return (
    <>
      <Text
        marginBottom={2}
        variant="small"
        fontWeight={errors?.signature ? 'semiBold' : 'regular'}
        color={(errors?.signature && 'red600') || 'dark400'}
      >
        Fylla þarf út nafn, staðsetningu eða dagsetningu undirritunar{' '}
        <Text fontWeight="regular" color="red600" as="span">
          *
        </Text>
      </Text>

      <Box id="signature">
        <Stack space={[1, 2]}>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '6/12']}>
              <InputController
                name="signature.name"
                label="Nafn undirritara"
                onChange={(val) => onChangeHandler('name', val)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <InputController
                name="signature.location"
                label="Staðsetning undirritara"
                onChange={(val) => onChangeHandler('location', val)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <InputController
                name="signature.onBehalfOf"
                label="F.h. undirritara"
                onChange={(val) => onChangeHandler('onBehalfOf', val)}
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <DatePickerController
                appearInline={true}
                name="signature.date"
                label="Dagsetning undirritunar"
                onChange={(date) =>
                  onChangeHandler('date', date?.toISOString() ?? '')
                }
              />
            </GridColumn>
          </GridRow>
        </Stack>
      </Box>
    </>
  )
}
