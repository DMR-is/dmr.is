import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  Button,
  GridColumn,
  GridRow,
  Inline,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { ONE_DAY, TWO_WEEKS } from '../../../../../lib/constants'
import {
  BankruptcyFormFields,
  BankruptcyFormSchema,
} from '../../../../../lib/forms/schemas/recall-schema'
import { getNextWeekday, getWeekendDays } from '../../../../../lib/utils'
import { DatePickerController } from '../../controllers/DatePickerController'

export const RecallPublishingFields = () => {
  const { getValues, setValue } = useFormContext<BankruptcyFormSchema>()
  const { applicationId } = getValues('meta')
  const { trigger } = useUpdateApplication({ applicationId })

  const currentDates = getValues('publishing')
  const divisionMeetingDate = getValues('divisionMeeting.date')

  const [dateState, setDateState] = useState<Date[]>(currentDates)

  const addDate = () => {
    const lastDate =
      dateState.length > 0
        ? new Date(dateState[dateState.length - 1])
        : new Date()
    const newDate = getNextWeekday(addDays(lastDate, TWO_WEEKS))
    const newDates = [...dateState, newDate]
    setDateState(newDates)
    setValue(BankruptcyFormFields.PUBLISHING_DATES, newDates)
    trigger({
      publishingDates: newDates.map((date) => new Date(date).toISOString()),
    })
  }

  const removeDate = (index: number) => {
    const newDates = dateState.filter((_, i) => i !== index)
    setValue(BankruptcyFormFields.PUBLISHING_DATES, newDates)
    setDateState(newDates)
    trigger({
      publishingDates: newDates.map((date) => new Date(date).toISOString()),
    })
  }

  const onDateChange = (date: Date, index: number) => {
    const newDates = [...dateState]
    newDates[index] = date
    setDateState(newDates)
    setValue(BankruptcyFormFields.PUBLISHING_DATES, newDates)
    trigger({
      publishingDates: newDates.map((d) => new Date(d).toISOString()),
    })
  }

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Birting innköllunar</Text>
      </GridColumn>
      <GridColumn span="12/12">
        <Stack space={[2, 3]}>
          {currentDates.map((date, index) => {
            const prevDate = index === 0 ? null : currentDates[index - 1]
            const maxDate = divisionMeetingDate
              ? new Date(divisionMeetingDate)
              : addYears(new Date(), ONE_DAY)

            const minDate =
              index === 0
                ? getNextWeekday(addDays(new Date(), TWO_WEEKS))
                : getNextWeekday(
                    addDays(
                      prevDate ? new Date(prevDate) : new Date(),
                      TWO_WEEKS,
                    ),
                  )
            const excludeDates = getWeekendDays(minDate, maxDate)

            return (
              <Inline
                space={[1, 2]}
                flexWrap="wrap"
                alignY="center"
                key={index}
              >
                <DatePickerController
                  maxDate={getNextWeekday(maxDate)}
                  label={`Birtingardagur ${index + 1}`}
                  name={`${BankruptcyFormFields.PUBLISHING_DATES}.${index}`}
                  required={index === 0}
                  defaultValue={date}
                  minDate={getNextWeekday(minDate)}
                  excludeDates={excludeDates}
                  onChange={(date) => onDateChange(date, index)}
                />
                <Button
                  circle
                  icon="trash"
                  iconType="outline"
                  size="default"
                  colorScheme="destructive"
                  disabled={dateState.length <= 1}
                  onClick={() => removeDate(index)}
                />
              </Inline>
            )
          })}
          <Button
            variant="utility"
            icon="add"
            iconType="outline"
            size="small"
            onClick={addDate}
            disabled={dateState.length >= 5}
          >
            Bæta við birtingardegi
          </Button>
        </Stack>
      </GridColumn>
    </GridRow>
  )
}
