import { addYears } from 'date-fns'
import addDays from 'date-fns/addDays'
import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  BaseApplicationWebSchema,
  CommonApplicationWebSchema,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { ONE_DAY, ONE_WEEK } from '../../../lib/constants'
import { DatePickerController } from '../controllers/DatePickerController'

type Props = {
  applicationType: 'COMMON' | 'RECALL'
}

export const PublishingFields = ({ applicationType }: Props) => {
  const { getValues, watch, setValue, formState } = useFormContext<
    | BaseApplicationWebSchema
    | RecallApplicationWebSchema
    | CommonApplicationWebSchema
  >()

  const { metadata } = getValues()
  const currentDates = watch('publishingDates') ?? []
  const { updateLocalOnly } = useUpdateApplication({
    id: metadata.applicationId,
    type: applicationType,
  })

  const updatePublishingDates = useCallback(
    (newDates: string[]) => {
      setValue('publishingDates', newDates)

      setValue('fields.divisionMeetingFields.meetingDate', null)

      const payload: {
        publishingDates: string[]
        fields?: { divisionMeetingFields: { meetingDate: null } }
      } = {
        publishingDates: newDates,
      }

      if (applicationType === 'RECALL') {
        payload.fields = {
          divisionMeetingFields: {
            meetingDate: null,
          },
        }
      }

      updateLocalOnly(payload)
    },
    [setValue, updateLocalOnly],
  )

  const addDate = useCallback(() => {
    if (currentDates.length > 2) return

    const lastDate =
      currentDates.length > 0
        ? new Date(currentDates[currentDates.length - 1])
        : new Date()

    const newDate = getNextValidPublishingDate(addDays(lastDate, ONE_DAY * 3))
    const newDates = [...currentDates, newDate.toISOString()]
    updatePublishingDates(newDates)
  }, [currentDates, updatePublishingDates])

  const removeDate = useCallback(
    (index: number) => {
      const newDates = currentDates.filter((_, i) => i !== index)
      updatePublishingDates(newDates)
    },
    [currentDates, updatePublishingDates],
  )

  const onDateChange = useCallback(
    (date: Date, index: number) => {
      const newDates = [...currentDates]
      newDates[index] = date.toISOString()
      updatePublishingDates(newDates)
    },
    [currentDates, updatePublishingDates],
  )

  const error = formState.errors?.publishingDates?.message

  return (
    <>
      {error && (
        <Box marginBottom={[2, 3]}>
          <AlertMessage type="error" title={error} />
        </Box>
      )}
      <Box id="publishingDates">
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Stack space={[2, 3]}>
              {currentDates?.map((date, index) => {
                const previousDate =
                  index > 0
                    ? addDays(new Date(currentDates[index - 1]), ONE_DAY)
                    : null

                const min = previousDate
                  ? getNextValidPublishingDate(previousDate)
                  : getNextValidPublishingDate()
                const max = getNextValidPublishingDate(addYears(min, 1))
                const excludeDates = getInvalidPublishingDatesInRange(min, max)

                return (
                  <Inline
                    space={[1, 2]}
                    flexWrap="wrap"
                    alignY="bottom"
                    key={index}
                  >
                    <DatePickerController
                      minDate={min}
                      maxDate={max}
                      excludeDates={excludeDates}
                      label={`Birtingardagur ${index + 1}`}
                      name={`${'publishingDates'}[${index}]`}
                      required={index === 0}
                      defaultValue={date}
                      onChange={(date) => onDateChange(date, index)}
                    />
                    <Button
                      icon="trash"
                      iconType="outline"
                      size="small"
                      variant="utility"
                      disabled={currentDates.length <= 1}
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
                disabled={currentDates.length >= 3}
              >
                Bæta við birtingardegi
              </Button>
            </Stack>
          </GridColumn>
        </GridRow>
      </Box>
    </>
  )
}
