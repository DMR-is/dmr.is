'use client'

import { useController, UseControllerProps } from 'react-hook-form'

import { Input } from '@dmr.is/ui/components/island-is'

type Props = UseControllerProps & {
  label?: string
  required?: boolean
  textArea?: boolean
  readonly?: boolean
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
}

export const InputController = (props: Props) => {
  const { label, required, ...rest } = props
  const { field, fieldState } = useController(rest)

  const error = fieldState.error

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    field.onChange(event.target.value)
    if (props.onChange) {
      props.onChange(event.target.value)
    }
  }

  const handleBlur = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    field.onBlur()
    if (props.onBlur) {
      props.onBlur(event.target.value)
    }
  }

  return (
    <Input
      {...field}
      label={label}
      readOnly={props.readonly}
      backgroundColor="blue"
      size="sm"
      textarea={props.textArea}
      defaultValue={props.defaultValue}
      errorMessage={error ? error.message : undefined}
      required={required}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
