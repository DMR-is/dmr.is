import addDays from 'date-fns/addDays'
import addYears from 'date-fns/addYears'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationInputFields,
  BaseApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  Box,
  Button,
  GridColumn,
  GridRow,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useUpdateApplicationJson } from '../../../hooks/useUpdateApplicationJson'
import { ONE_DAY, TWO_WEEKS } from '../../../lib/constants'
import { getNextWeekday, getWeekendDays } from '../../../lib/utils'
import { DatePickerController } from '../controllers/DatePickerController'

type Props = {
  additionalTitle?: string
  alert?: React.ReactElement<typeof AlertMessage>
}

export const PublishingFields = ({ additionalTitle, alert }: Props) => {
  const { getValues, watch, setValue } =
    useFormContext<BaseApplicationWebSchema>()

  const { metadata } = getValues()

  const { updateApplicationJson } = useUpdateApplicationJson({
    id: metadata.applicationId,
    type: metadata.type,
  })

  const currentDates =
    watch(
      ApplicationInputFields.PUBLISHING_DATES,
      getValues(ApplicationInputFields.PUBLISHING_DATES),
    ) || []

  const [dateState, setDateState] = useState(currentDates)

  const addDate = () => {
    if (dateState.length >= 3) return

    const lastDate =
      dateState.length > 0
        ? new Date(dateState[dateState.length - 1])
        : new Date()
    const newDate = getNextWeekday(addDays(lastDate, TWO_WEEKS))
    const newDates = [...dateState, newDate.toISOString()]
    setDateState(newDates)
    setValue(ApplicationInputFields.PUBLISHING_DATES, newDates)
    updateApplicationJson({
      publishingDates: newDates,
    })
  }

  const removeDate = (index: number) => {
    const newDates = dateState.filter((_, i) => i !== index)
    setValue(ApplicationInputFields.PUBLISHING_DATES, newDates)
    setDateState(newDates)
    updateApplicationJson({
      publishingDates: newDates,
    })
  }

  const onDateChange = (date: Date, index: number) => {
    const newDates = [...dateState]
    newDates[index] = date.toISOString()
    setDateState(newDates)
    setValue(ApplicationInputFields.PUBLISHING_DATES, newDates)
    updateApplicationJson({
      publishingDates: newDates,
    })
  }

  return (
    <Box id="publishingDates">
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">{`Birting${additionalTitle ? ` ${additionalTitle}` : ''}`}</Text>
        </GridColumn>
        {alert && <GridColumn span="12/12">{alert}</GridColumn>}
        <GridColumn span="12/12">
          <Stack space={[2, 3]}>
            {currentDates.map((date, index) => {
              const prevDate = index === 0 ? null : currentDates[index - 1]
              const maxDate = addYears(new Date(), ONE_DAY)

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
                    name={`${ApplicationInputFields.PUBLISHING_DATES}[${index}]`}
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
              disabled={dateState.length >= 3}
            >
              Bæta við birtingardegi
            </Button>
          </Stack>
        </GridColumn>
      </GridRow>
    </Box>
  )
}
