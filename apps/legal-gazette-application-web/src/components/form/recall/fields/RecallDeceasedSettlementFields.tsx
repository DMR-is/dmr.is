import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { AlertMessage, Select } from '@dmr.is/ui/components/island-is'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import {
  NationalIdLookup,
  NationalIdLookupResults,
} from '../../../national-id-lookup/NationalIdLookup'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallDeceasedSettlementFields = () => {
  const { getValues, setValue } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateApplication, debouncedUpdateApplication } =
    useUpdateApplication({
      id: applicationId,
      type: 'RECALL',
    })

  const [onLookupError, setOnLookupError] = useState<{
    title: string
    message: string
  } | null>(null)

  const onSuccessfulLookup = ({
    address,
    name,
    city,
    nationalId,
    zipCode,
  }: NationalIdLookupResults) => {
    setValue('fields.settlementFields.name', name)
    setValue(
      'fields.settlementFields.address',
      `${address}, ${zipCode} ${city}`,
    )
    setValue('fields.settlementFields.nationalId', nationalId)
    updateApplication(
      {
        fields: {
          settlementFields: {
            name: name,
            address: `${address}, ${zipCode} ${city}`,
            nationalId: nationalId,
          },
        },
      },
      {
        successMessage: 'Upplýsingar um þrotabú vistaðar',
        errorMessage: 'Ekki tókst að vista upplýsingar um þrotabú',
      },
    )
  }

  const resetLookupFields = () => {
    setValue('fields.settlementFields.nationalId', '')
    updateApplication({
      fields: {
        settlementFields: {
          name: '',
          address: '',
          nationalId: '',
        },
      },
    })
  }

  return (
    <Select
      options={[
        {
          label: 'Óskipt dánarbú',
          value: 'undividedEstate',
        },
        {
          label: 'Eigandi samlagsfélags',
          value: 'dividedEstate',
        },
      ]}
    />
  )
}

/*

(
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h4">Upplýsingar um dánarbúið</Text>
      </GridColumn>
      {onLookupError && (
        <GridColumn span="12/12">
          <AlertMessage type="error" {...onLookupError} />
        </GridColumn>
      )}
      <GridColumn span={['12/12', '6/12']}>
        <NationalIdLookup
          defaultValue={getValues('fields.settlementFields.nationalId') ?? ''}
          onSuccessfulLookup={onSuccessfulLookup}
          onReset={resetLookupFields}
          onError={setOnLookupError}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          name="fields.settlementFields.dateOfDeath"
          maxDate={undefined}
          minDate={undefined}
          label="Dánardagur"
          required
          onChange={(val) => (
            updateApplication({
              fields: {
                settlementFields: {
                  dateOfDeath: val.toISOString(),
                },
              },
            }),
            {
              successMessage: 'Dánardagur vistaður',
              errorMessage: 'Ekki tókst að vista dánardag',
            }
          )}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name="fields.settlementFields.name"
          label={`Nafn dánarbús`}
          required
          onChange={(val) =>
            debouncedUpdateApplication(
              {
                fields: {
                  settlementFields: {
                    name: val,
                  },
                },
              },
              {
                successMessage: `Nafn dánarbús vistað`,
                errorMessage: `Ekki tókst að vista nafn dánarbús`,
              },
            )
          }
        />
      </GridColumn>

      <GridColumn span={['12/12', '6/12']}>
        <InputController
          required
          name="fields.settlementFields.address"
          label="Síðasta heimilisfang"
          onChange={(val) =>
            debouncedUpdateApplication(
              {
                fields: {
                  settlementFields: {
                    address: val,
                  },
                },
              },
              {
                successMessage: `Heimilisfang dánarbús vistað`,
                errorMessage: `Ekki tókst að vista heimilisfang dánarbús`,
              },
            )
          }
        />
      </GridColumn>
    </GridRow>
  )

*/
