import { useController, UseControllerProps } from 'react-hook-form'

import { DatePicker } from '@island.is/island-ui/core'

type Props = UseControllerProps & {
  label: string
  required?: boolean
  maxDate?: Date
  minDate?: Date
  excludeDates?: Date[]
  withTime?: boolean
  onChange?: (date: Date) => void
}

export const DatePickerController = (props: Props) => {
  const { label, required, onChange, minDate, maxDate, excludeDates, ...rest } =
    props
  const { field, fieldState } = useController(rest)

  const error = fieldState.error

  const handleChange = (date: Date) => {
    field.onChange(date.toISOString())
    if (onChange) {
      onChange(date)
    }
  }

  const asDate =
    typeof field.value === 'string' ? new Date(field.value) : field.value

  return (
    <DatePicker
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
  )
}
