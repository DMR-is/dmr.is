import { useRef } from 'react'

import { Editor, EditorFileUploader } from '@dmr.is/regulations-tools/Editor'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { classes } from './Editor.css'

type Props = {
  defaultValue?: HTMLText | string
  onChange?: (value: HTMLText) => void
  readonly?: boolean
  handleUpload: EditorFileUploader
  onBlur?: (value: HTMLText) => void
}

export const HTMLEditor = ({
  defaultValue = '',
  readonly = false,
  onChange,
  handleUpload,
  onBlur,
}: Props) => {
  const valueRef = useRef(() => defaultValue as HTMLText)

  const handleChange = (value: HTMLText) => {
    onChange && onChange(value)
  }

  return (
    <Editor
      readOnly={readonly}
      valueRef={valueRef}
      fileUploader={handleUpload}
      classes={classes}
      key={readonly ? 'readonly' : 'editable'}
      config={readonly ? { toolbar: `` } : {}}
      disabledWarnings={['nonEmTitleContent']}
      /**
       * Delayed onChange to prevent the editor from reading the value before it has been updated
       */
      onChange={() => setTimeout(() => handleChange(valueRef.current()), 100)}
      onBlur={() => onBlur?.(valueRef.current())}
    />
  )
}
