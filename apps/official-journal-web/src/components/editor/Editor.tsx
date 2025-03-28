import { useRef } from 'react'

import { Editor, EditorFileUploader } from '@island.is/regulations-tools/Editor'
import { HTMLText } from '@island.is/regulations-tools/types'

import { classes } from './Editor.css'

type Props = {
  defaultValue?: HTMLText | string
  onChange?: (value: HTMLText) => void
  readonly?: boolean
  handleUpload: EditorFileUploader
}

export const HTMLEditor = ({
  defaultValue = '',
  readonly = false,
  onChange,
  handleUpload,
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
      /**
       * Delayed onChange to prevent the editor from reading the value before it has been updated
       */
      onChange={() => setTimeout(() => handleChange(valueRef.current()), 100)}
    />
  )
}
