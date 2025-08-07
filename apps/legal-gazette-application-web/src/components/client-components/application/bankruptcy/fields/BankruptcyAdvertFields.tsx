'use client'

import { useFormContext } from 'react-hook-form'
import { Key } from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  GridColumn,
  GridRow,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import {
  ApiErrorDto,
  UpdateBankruptcyApplicationDto,
  UpdateBankruptcyApplicationRequest,
} from '../../../../../gen/fetch'
import { updateBankruptcyApplication } from '../../../../../lib/fetchers'
import {
  BankruptcyApplicationSchema,
  BankruptcyFormFields,
} from '../../../../../lib/schemas'
import { DatePickerController } from '../../../controllers/DatePickerController'
import { InputController } from '../../../controllers/InputController'
import { SelectController } from '../../../controllers/SelectController'

export const BankruptcyAdvertFields = () => {
  const { getValues } = useFormContext<BankruptcyApplicationSchema>()

  const applicationMeta = getValues('meta')

  const { trigger: updateApplicationTrigger } = useSWRMutation<
    void,
    ApiErrorDto,
    Key,
    UpdateBankruptcyApplicationRequest
  >(
    'updateBankruptcyAdvertFields',
    (_key: string, { arg }: { arg: UpdateBankruptcyApplicationRequest }) =>
      updateBankruptcyApplication(arg),
  )

  const trigger = (data: UpdateBankruptcyApplicationDto) => {
    updateApplicationTrigger(
      {
        applicationId: applicationMeta.applicationId,
        caseId: applicationMeta.caseId,
        updateBankruptcyApplicationDto: data,
      },
      {
        onSuccess: () => {
          toast.success('Umsókn vistuð', {
            toastId: 'bankruptcyAdvertFieldsSuccess',
          })
        },
        onError: (_error) => {
          toast.error('Ekki tóskt að visa umsókn', {
            toastId: 'bankruptcyAdvertFieldsError',
          })
        },
      },
    )
  }

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={applicationMeta.courtOptions}
            name={BankruptcyFormFields.ADVERT_COURT_ID}
            label="Dómstóll"
            required
            onChange={(val) => trigger({ courtDistrictId: val })}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name={BankruptcyFormFields.ADVERT_JUDGEMENT_DATE}
            label="Úrskurðardagur"
            required
            onChange={(val) =>
              trigger({ judgmentDate: val ? val.toISOString() : undefined })
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name={BankruptcyFormFields.ADVERT_ADDITIONAL_TEXT}
            label="Frjáls texti"
            onBlur={(val) => trigger({ additionalText: val })}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
