'use client'

import { useController, UseControllerProps } from 'react-hook-form'

import { Select } from '@dmr.is/ui/components/island-is/Select'

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

  const handleFirstBlur = () => {
    if (!fieldState.isTouched) {
      field.onBlur()
    }
  }

  const { ref: _ref, ...fieldWithoutRef } = field

  return (
    <div onBlur={handleFirstBlur}>
      <Select
        id={field.name}
        {...fieldWithoutRef}
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
    </div>
  )
}
