import { useRef } from 'react'

import { Editor, EditorFileUploader } from '@island.is/regulations-tools/Editor'
import { HTMLText } from '@island.is/regulations-tools/types'

import { classes } from './Editor.css'

type Props = {
  defaultValue?: HTMLText | string
  readonly?: boolean
  handleUpload: EditorFileUploader
  config?: React.ComponentProps<typeof Editor>['config']
  onChange?: (value: HTMLText) => void
  onBlur?: (value: HTMLText) => void
  disabled?: boolean
}

export const HTMLEditor = ({
  defaultValue = '',
  readonly = false,
  onChange,
  onBlur,
  handleUpload,
  config,
  disabled,
}: Props) => {
  const valueRef = useRef(() => defaultValue as HTMLText)

  const handleChange = (value: HTMLText) => {
    onChange && onChange(value)
  }

  return (
    <Editor
      disabled={disabled}
      readOnly={readonly}
      valueRef={valueRef}
      fileUploader={handleUpload}
      classes={classes}
      key={readonly ? 'readonly' : 'editable'}
      config={readonly ? { toolbar: `` } : config}
      /**
       * Delayed onChange to prevent the editor from reading the value before it has been updated
       */
      onChange={() => setTimeout(() => handleChange(valueRef.current()), 100)}
      onBlur={() => onBlur?.(valueRef.current())}
    />
  )
}
