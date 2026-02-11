'use client'

import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallAdvertFields = () => {
  const trpc = useTRPC()
  const { getValues, setValue } = useFormContext<RecallApplicationWebSchema>()

  const { applicationId } = getValues('metadata')

  const { data: courtOptions } = useQuery(trpc.getCourtDistricts.queryOptions())

  const { updateLocalOnly } = useUpdateApplication({
    id: applicationId,
    type: 'RECALL',
  })

  const courtOptionsData =
    courtOptions?.courtDistricts.map((court) => ({
      label: court.title,
      value: court.id,
    })) || []

  return (
    <Stack space={[1, 2]}>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={courtOptionsData}
            name="fields.courtAndJudgmentFields.courtDistrict.id"
            label="Dómstóll"
            required
            onChange={(val) => {
              const found = courtOptions?.courtDistricts.find(
                (option) => option.id === val,
              )

              setValue('fields.courtAndJudgmentFields.courtDistrict', found)
              return updateLocalOnly({
                fields: {
                  courtAndJudgmentFields: {
                    courtDistrict: found,
                  },
                },
              })
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name="fields.courtAndJudgmentFields.judgmentDate"
            label="Úrskurðardagur"
            required
            onChange={(val) =>
              updateLocalOnly({
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
              // Save to localStorage only - server sync happens on navigation
              updateLocalOnly({ additionalText: val })
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
