import { useController, UseControllerProps } from 'react-hook-form'

import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import {
  fromCalendarDateIso,
  fromReykjavikDateTimeIso,
  toCalendarDateIso,
  toReykjavikDateTimeIso,
} from '@dmr.is/utils-shared/date/calendarDate'

import {
  MAX_SELECTABLE_YEAR,
  MIN_SELECTABLE_YEAR,
} from '../../../lib/constants'

type Props = UseControllerProps & {
  label: string
  required?: boolean
  maxDate?: Date
  minDate?: Date
  excludeDates?: Date[]
  withTime?: boolean
  onChange?: (date: Date) => void
  appearInline?: boolean
}

export const DatePickerController = (props: Props) => {
  const {
    label,
    required,
    onChange,
    minDate,
    maxDate,
    excludeDates,
    appearInline,
    ...rest
  } = props
  const { field, fieldState } = useController(rest)

  const error = fieldState.error

  // Send the clock face the user saw, not the instant their computer was at. A
  // calendar day picked at a positive UTC offset otherwise lands on the previous
  // day, and a skiptafundur time entered from abroad otherwise publishes shifted
  // by the difference - both fields name a Reykjavik wall clock.
  const handleChange = (date: Date) => {
    field.onChange(
      props.withTime ? toReykjavikDateTimeIso(date) : toCalendarDateIso(date),
    )
    if (onChange) {
      onChange(date)
    }
  }

  const handleFirstBlur = () => {
    if (!fieldState.isTouched) {
      field.onBlur()
    }
  }

  const value =
    typeof field.value === 'string' ? new Date(field.value) : field.value
  const asDate = !(value instanceof Date)
    ? value
    : props.withTime
      ? fromReykjavikDateTimeIso(value)
      : fromCalendarDateIso(value)

  return (
    <div onBlur={handleFirstBlur}>
      <DatePicker
        appearInline={appearInline}
        maxYear={MAX_SELECTABLE_YEAR}
        minYear={MIN_SELECTABLE_YEAR}
        id={field.name}
        name={field.name}
        handleChange={handleChange}
        selected={asDate}
        label={label}
        backgroundColor="blue"
        size="sm"
        showTimeInput={props.withTime}
        errorMessage={error ? error.message : undefined}
        required={required}
        locale="is"
        placeholderText={undefined}
        maxDate={maxDate}
        minDate={minDate}
        excludeDates={excludeDates}
      />
    </div>
  )
}
