import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useUpdateBankruptcyApplication } from '../../../../../hooks/useUpdateBankruptcyApplication'
import { TWO_WEEKS } from '../../../../../lib/constants'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/schemas'
import { getNextWeekday, getWeekendDays } from '../../../../../lib/utils'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

export const BankruptcyDivisionFields = () => {
  const { getValues, setValue, watch } = useFormContext<BankruptcyFormSchema>()
  const { caseId, applicationId } = getValues('meta')

  const recallDates = watch(BankruptcyFormFields.PUBLISHING_DATES)

  useEffect(() => {
    // we need to reset the division meeting date if the recall dates change
    setValue(
      BankruptcyFormFields.DIVISION_MEETING_DATE,
      undefined as unknown as Date,
    )
    trigger({
      settlementMeetingDate: null,
    })
  }, [recallDates])

  const { trigger } = useUpdateBankruptcyApplication({
    caseId,
    applicationId,
  })

  const minDate = recallDates?.length
    ? addDays(new Date(recallDates[recallDates.length - 1]), TWO_WEEKS)
    : addDays(new Date(), TWO_WEEKS)

  const maxDate = addYears(minDate, 1)
  const excludeDates = getWeekendDays(minDate, maxDate)

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Upplýsingar um skiptafund</Text>
      </GridColumn>

      <GridColumn span="6/12">
        <InputController
          required
          name={BankruptcyFormFields.DIVISION_MEETING_LOCATION}
          label="Staðsetning skiptafundar"
          onBlur={(location) =>
            trigger({ settlementMeetingLocation: location })
          }
        />
      </GridColumn>
      <GridColumn span="6/12">
        <DatePickerController
          required
          name={BankruptcyFormFields.DIVISION_MEETING_DATE}
          label="Dagsetning skiptafundar"
          minDate={minDate ? getNextWeekday(minDate) : undefined}
          maxDate={maxDate}
          excludeDates={excludeDates}
          onChange={(date) =>
            trigger({ settlementMeetingDate: date.toISOString() })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
