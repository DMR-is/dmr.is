import { useController, UseControllerProps } from 'react-hook-form'

import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import {
  fromCalendarDateIso,
  toCalendarDateIso,
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

  // Without a time input the field is a calendar day, so send the day the user
  // saw rather than their local midnight expressed as an instant - the latter
  // lands on the previous day for any browser at a positive UTC offset.
  const handleChange = (date: Date) => {
    field.onChange(
      props.withTime ? date.toISOString() : toCalendarDateIso(date),
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
  const asDate =
    value instanceof Date && !props.withTime
      ? fromCalendarDateIso(value)
      : value

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
