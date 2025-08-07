import { useController, UseControllerProps } from 'react-hook-form'

import { DatePicker } from '@island.is/island-ui/core'

type Props = UseControllerProps & {
  label: string
  required?: boolean
  onChange?: (date: Date) => void
}

export const DatePickerController = (props: Props) => {
  const { label, required, onChange, ...rest } = props
  const { field, fieldState } = useController(rest)

  const error = fieldState.error

  const handleChange = (date: Date) => {
    field.onChange(date)
    if (onChange) {
      onChange(date)
    }
  }

  return (
    <DatePicker
      name={field.name}
      handleChange={handleChange}
      selected={field.value}
      label={label}
      backgroundColor="blue"
      size="sm"
      errorMessage={error ? error.message : undefined}
      required={required}
      locale="is"
      placeholderText={undefined}
    />
  )
}
