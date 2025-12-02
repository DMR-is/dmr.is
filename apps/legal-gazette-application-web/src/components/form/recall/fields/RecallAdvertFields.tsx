'use client'

import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallAdvertFields = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()

  const { applicationId, courtOptions } = getValues('metadata')

  const { updateApplicationJson, debouncedUpdateApplicationJson } =
    useUpdateApplicationJson({
      id: applicationId,
      type: 'RECALL',
    })

  return (
    <Stack space={[1, 2]}>
      <Text variant="h4">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={courtOptions}
            name="fields.courtAndJudgmentFields.courtDistrictId"
            label="Dómstóll"
            required
            onChange={(val) =>
              updateApplicationJson({
                fields: {
                  courtAndJudgmentFields: {
                    courtDistrictId: val,
                  },
                },
              })
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name="fields.courtAndJudgmentFields.judgmentDate"
            label="Úrskurðardagur"
            required
            onChange={(val) =>
              updateApplicationJson({
                fields: {
                  courtAndJudgmentFields: { judgmentDate: val.toISOString() },
                },
              })
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            textArea
            name="additionalText"
            label="Frjáls texti"
            onChange={(val) =>
              debouncedUpdateApplicationJson({ additionalText: val })
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
