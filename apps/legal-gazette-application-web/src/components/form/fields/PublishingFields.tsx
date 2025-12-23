import { addYears } from 'date-fns'
import addDays from 'date-fns/addDays'
import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  BaseApplicationWebSchema,
  RecallApplicationWebSchema,
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
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/date'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { ONE_DAY, ONE_WEEK } from '../../../lib/constants'
import { DatePickerController } from '../controllers/DatePickerController'

type Props = {
  additionalTitle?: string
  applicationType?: 'COMMON' | 'RECALL'
}

export const PublishingFields = ({
  additionalTitle,
  applicationType = 'COMMON',
}: Props) => {
  const { getValues, watch, setValue, formState } = useFormContext<
    BaseApplicationWebSchema | RecallApplicationWebSchema
  >()

  const { metadata } = getValues()
  const currentDates = watch('publishingDates') ?? []
  const { updateApplication } = useUpdateApplication({
    id: metadata.applicationId,
    type: applicationType,
  })

  const updatePublishingDates = useCallback(
    (newDates: string[]) => {
      setValue('publishingDates', newDates)

      if (applicationType === 'RECALL') {
        setValue('fields.divisionMeetingFields.meetingDate', null)
      }

      const payload =
        applicationType === 'RECALL'
          ? {
              publishingDates: newDates,
              fields: {
                divisionMeetingFields: {
                  meetingDate: null,
                },
              },
            }
          : { publishingDates: newDates }

      updateApplication(payload, {
        successMessage: 'Birtingardagar vistaðir',
        errorMessage: 'Ekki tókst að vista birtingardaga',
      })
    },
    [setValue, applicationType, updateApplication],
  )

  const addDate = useCallback(() => {
    if (currentDates.length > 2) return

    const lastDate =
      currentDates.length > 0
        ? new Date(currentDates[currentDates.length - 1])
        : new Date()

    const newDate = getNextValidPublishingDate(addDays(lastDate, ONE_WEEK))
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

  const signatureError = formState.errors.publishingDates

  return (
    <Box id="publishingDates">
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Stack space={[2, 3]}>
            <Text variant="h4">
              {`Birting${additionalTitle ? ` ${additionalTitle}` : ''}`}{' '}
              <Text fontWeight="regular" color="red600" as="span">
                *
              </Text>
            </Text>
            {signatureError && (
              <AlertMessage
                type="error"
                title="Birtingardagar ekki rétt útfylltir"
                message={signatureError.message}
              />
            )}
          </Stack>
        </GridColumn>
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
                  alignY="center"
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
                    circle
                    icon="trash"
                    iconType="outline"
                    size="default"
                    colorScheme="destructive"
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
  )
}
