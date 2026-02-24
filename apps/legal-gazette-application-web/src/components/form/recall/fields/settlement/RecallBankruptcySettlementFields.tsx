import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette-schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  NationalIdLookup,
  NationalIdLookupResults,
} from '../../../../national-id-lookup/NationalIdLookup'
import { DatePickerController } from '../../../controllers/DatePickerController'
import { InputController } from '../../../controllers/InputController'

type ErrorState = {
  title: string
  message: string
} | null
export const RecallBankruptcySettlementFields = () => {
  const { getValues, setValue } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { updateLocalOnly } = useUpdateApplication({
    id: applicationId,
    type: 'RECALL',
  })

  const [onLookupError, setOnLookupError] = useState<ErrorState>(null)
  const [kennitalaValue, setKennitalaValue] = useState<string | null>(null)

  const onLookupErrorHandler = (error: ErrorState) => {
    setOnLookupError(error)
    if (!error) return

    // update application with nationalId even though it was not found in
    // national registry, so that user can proceed even if lookup fails
    // Save to localStorage only - server sync happens on navigation
    updateLocalOnly({
      fields: {
        settlementFields: {
          nationalId: kennitalaValue,
        },
      },
    })
  }

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
    updateLocalOnly({
      fields: {
        settlementFields: {
          name: name,
          address: `${address}, ${zipCode} ${city}`,
          nationalId: nationalId,
        },
      },
    })
  }

  const resetLookupFields = () => {
    setValue('fields.settlementFields.nationalId', '')
    updateLocalOnly({
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
    <GridRow rowGap={[2, 3]}>
      {onLookupError && (
        <GridColumn span="12/12">
          <AlertMessage type="warning" {...onLookupError} />
        </GridColumn>
      )}
      <GridColumn span={['12/12', '6/12']}>
        <NationalIdLookup
          defaultValue={getValues('fields.settlementFields.nationalId') ?? ''}
          onSuccessfulLookup={onSuccessfulLookup}
          onReset={resetLookupFields}
          onError={(error: ErrorState) => {
            onLookupErrorHandler(error)
          }}
          onChange={(val) => {
            setKennitalaValue(val)
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePickerController
          name="fields.settlementFields.deadlineDate"
          maxDate={new Date()}
          label="Frestdagur þrotabús"
          required
          onChange={(val) =>
            updateLocalOnly({
              fields: {
                settlementFields: {
                  deadlineDate: val.toISOString(),
                },
              },
            })
          }
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name="fields.settlementFields.name"
          label="Nafn þrotabús"
          required
          onChange={(val) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: {
                settlementFields: {
                  name: val,
                },
              },
            })
          }
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          required
          name="fields.settlementFields.address"
          label="Heimilisfang þrotabús"
          onChange={(val) =>
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: {
                settlementFields: {
                  address: val,
                },
              },
            })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
