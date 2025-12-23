'use client'

import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn, GridRow, Stack } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'

export const RecallAdvertFields = () => {
  const trpc = useTRPC()
  const { getValues } = useFormContext<RecallApplicationWebSchema>()

  const { applicationId } = getValues('metadata')

  const { data: courtOptions } = useQuery(trpc.getCourtDistricts.queryOptions())

  const { updateApplication, debouncedUpdateApplication } =
    useUpdateApplication({
      id: applicationId,
      type: 'RECALL',
    })

  return (
    <Stack space={[1, 2]}>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            options={
              courtOptions?.courtDistricts.map((court) => ({
                label: court.title,
                value: court.id,
              })) || []
            }
            name="fields.courtAndJudgmentFields.courtDistrictId"
            label="Dómstóll"
            required
            onChange={(val) =>
              updateApplication(
                {
                  fields: {
                    courtAndJudgmentFields: {
                      courtDistrict: courtOptions?.courtDistricts.find(
                        (option) => option.id === val,
                      ),
                    },
                  },
                },
                {
                  successMessage: 'Dómstóll vistaður',
                  errorMessage: 'Ekki tókst að vista dómstól',
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePickerController
            name="fields.courtAndJudgmentFields.judgmentDate"
            label="Úrskurðardagur"
            required
            onChange={(val) =>
              updateApplication(
                {
                  fields: {
                    courtAndJudgmentFields: { judgmentDate: val.toISOString() },
                  },
                },
                {
                  successMessage: 'Úrskurðardagur vistaður',
                  errorMessage: 'Ekki tókst að vista úrskurðardag',
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            textArea
            name="additionalText"
            label="Frjáls texti"
            onChange={(val) =>
              debouncedUpdateApplication(
                { additionalText: val },
                {
                  successMessage: 'Frjáls texti vistaður',
                  errorMessage: 'Ekki tókst að vista frjálsan texta',
                },
              )
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
