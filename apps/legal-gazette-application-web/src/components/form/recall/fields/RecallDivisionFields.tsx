import { addDays, addYears } from 'date-fns'
import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  GridColumn,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/date'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { ONE_WEEK } from '../../../../lib/constants'
import { DatePickerController } from '../../controllers/DatePickerController'
import { InputController } from '../../controllers/InputController'

type Props = {
  isBankruptcy: boolean
}

export const RecallDivisionFields = ({ isBankruptcy }: Props) => {
  const { getValues, watch } = useFormContext<RecallApplicationWebSchema>()
  const { applicationId } = getValues('metadata')

  const { debouncedUpdateApplication } = useUpdateApplication({
    id: applicationId,
    type: 'RECALL',
  })

  const recallDates = watch('publishingDates') || []

  const minDate = recallDates.length
    ? getNextValidPublishingDate(
        addDays(new Date(recallDates[0]), ONE_WEEK * 9),
      )
    : getNextValidPublishingDate()
  const maxDate = getNextValidPublishingDate(addYears(minDate, 5))
  const excludeDates = getInvalidPublishingDatesInRange(minDate, maxDate)

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="6/12">
        <InputController
          required={isBankruptcy}
          name="fields.divisionMeetingFields.meetingLocation"
          label="Staðsetning skiptafundar"
          onChange={(location) =>
            debouncedUpdateApplication(
              {
                fields: {
                  divisionMeetingFields: {
                    meetingLocation: location,
                  },
                },
              },
              {
                successMessage: 'Staðsetning skiptafundar vistuð',
                errorMessage: 'Ekki tókst að vista staðsetningu skiptafundar',
              },
            )
          }
        />
      </GridColumn>
      <GridColumn span="6/12">
        {recallDates.length === 0 ? (
          <AlertMessage type="info" title="Veldu birtingardag fyrst" />
        ) : (
          <DatePickerController
            required={isBankruptcy}
            withTime={true}
            name="fields.divisionMeetingFields.meetingDate"
            label="Dagsetning skiptafundar"
            minDate={minDate}
            maxDate={maxDate}
            excludeDates={excludeDates}
            onChange={(date) =>
              debouncedUpdateApplication(
                {
                  fields: {
                    divisionMeetingFields: {
                      meetingDate: date.toISOString(),
                    },
                  },
                },
                {
                  successMessage: 'Dagsetning skiptafundar vistuð',
                  errorMessage: 'Ekki tókst að vista dagsetningu skiptafundar',
                },
              )
            }
          />
        )}
      </GridColumn>
    </GridRow>
  )
}
