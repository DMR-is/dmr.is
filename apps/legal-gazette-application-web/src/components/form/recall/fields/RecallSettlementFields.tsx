import subDays from 'date-fns/subDays'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is'
import { GridColumn, GridRow, Text } from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { POSTPONE_LIMIT } from '../../../../lib/constants'
import {
  NationalIdLookup,
  NationalIdLookupResults,
} from '../../../national-id-lookup/NationalIdLookup'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const RecallSettlementFields = () => {
  const { getValues, setValue } = useFormContext<RecallApplicationWebSchema>()
  const { type, applicationId } = getValues('metadata')

  const isRecallBankruptcy = type === ApplicationTypeEnum.RECALL_BANKRUPTCY

  const title = isRecallBankruptcy
    ? 'Upplýsingar um þrotabúið'
    : 'Upplýsingar um dánarbúið'

  const settlementType = isRecallBankruptcy ? 'þrotabús' : 'dánarbús'

  const { updateApplicationJson, debouncedUpdateApplicationJson } =
    useUpdateApplicationJson({
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
    updateApplicationJson({
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
    updateApplicationJson({
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
      <GridColumn span="12/12">
        <Text variant="h4">{title}</Text>
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
          name={
            isRecallBankruptcy
              ? 'fields.settlementFields.deadlineDate'
              : 'fields.settlementFields.dateOfDeath'
          }
          maxDate={isRecallBankruptcy ? new Date() : undefined}
          minDate={
            isRecallBankruptcy ? subDays(new Date(), POSTPONE_LIMIT) : undefined
          }
          label={isRecallBankruptcy ? 'Frestdagur þrotabús' : 'Dánardagur'}
          required
          onChange={(val) => {
            if (isRecallBankruptcy) {
              return updateApplicationJson({
                fields: {
                  settlementFields: {
                    deadlineDate: val.toISOString(),
                  },
                },
              })
            }

            return updateApplicationJson({
              fields: {
                settlementFields: {
                  dateOfDeath: val.toISOString(),
                },
              },
            })
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <InputController
          name="fields.settlementFields.name"
          label={`Nafn ${settlementType}`}
          required
          onChange={(val) =>
            debouncedUpdateApplicationJson({
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
          label={
            settlementType === 'þrotabús'
              ? 'Heimilisfang þrotabús'
              : 'Síðasta heimilisfang'
          }
          onChange={(val) =>
            debouncedUpdateApplicationJson({
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
