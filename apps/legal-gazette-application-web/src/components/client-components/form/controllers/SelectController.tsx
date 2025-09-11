'use client'

import { useController, UseControllerProps } from 'react-hook-form'

import { Select } from '@island.is/island-ui/core'

export const SelectController = (
  props: UseControllerProps & {
    label?: string
    required?: boolean
    options: { value: string; label: string }[]
    onChange?: (value?: string) => void
  },
) => {
  const { label, required, options, ...rest } = props
  const { field, fieldState } = useController(rest)

  const error = fieldState.error

  const handleChange = (value?: string) => {
    field.onChange(value)
    if (props.onChange) {
      props.onChange(value)
    }
  }

  const value = field.value
  console.log(field.name, value)

  return (
    <Select
      {...field}
      label={label}
      backgroundColor="blue"
      size="sm"
      options={options}
      value={options.find((opt) => opt.value === field.value)}
      hasError={!!error}
      errorMessage={error ? error.message : undefined}
      required={required}
      onChange={(opt) => handleChange(opt?.value)}
      isDisabled={props.disabled}
    />
  )
}
