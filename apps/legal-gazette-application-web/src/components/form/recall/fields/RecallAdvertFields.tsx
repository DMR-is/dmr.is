'use client'

import { useFormContext } from 'react-hook-form'

import {
  ApplicationInputFields,
  RecallApplicationInputFields,
  RecallApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'
import {
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { useUpdateRecallApplication } from '../../../../hooks/useUpdateRecallApplication'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallAdvertFields = () => {
  const { getValues } = useFormContext<RecallApplicationSchema>()

  const { applicationId, courtDistrictOptions } = getValues('metadata')

  const { updateAdditionalText } = useUpdateApplication(applicationId)

  const { updateCourtDistrict, updateJudgmentDate } =
    useUpdateRecallApplication(applicationId)

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={courtDistrictOptions}
            name={RecallApplicationInputFields.COURT_DISTRICT_ID}
            label="Dómstóll"
            required
            onChange={(val) => updateCourtDistrict(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name={RecallApplicationInputFields.JUDGMENT_DATE}
            label="Úrskurðardagur"
            required
            onChange={(val) => updateJudgmentDate(val.toISOString())}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            textArea
            name={ApplicationInputFields.ADDITIONAL_TEXT}
            label="Frjáls texti"
            onBlur={(val) => updateAdditionalText(val)}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
