'use client'

import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  RecallFormFields,
  RecallFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallAdvertFields = () => {
  const { getValues } = useFormContext<RecallFormSchema>()

  const { applicationId, courtOptions } = getValues('meta')

  const { trigger } = useUpdateApplication({
    applicationId: applicationId,
  })

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={courtOptions}
            name={RecallFormFields.COURT_ID}
            label="Dómstóll"
            required
            onChange={(val) => trigger({ courtDistrictId: val })}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name={RecallFormFields.JUDGEMENT_DATE}
            label="Úrskurðardagur"
            required
            onChange={(val) =>
              trigger({ judgmentDate: val ? val.toISOString() : undefined })
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            textArea
            name={RecallFormFields.ADDITIONAL_TEXT}
            label="Frjáls texti"
            onBlur={(val) => trigger({ additionalText: val })}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
