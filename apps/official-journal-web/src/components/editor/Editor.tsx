import { useRef } from 'react'

import { Editor } from '@island.is/regulations-tools/Editor'
import { HTMLText } from '@island.is/regulations-tools/types'

import { classes } from './Editor.css'

type Props = {
  defaultValue?: HTMLText | string
  onChange?: (value: HTMLText) => void
  readonly?: boolean
}

export const HTMLEditor = ({ defaultValue = '', readonly = false }: Props) => {
  const valueRef = useRef(() => defaultValue as HTMLText)

  const handleUpload = () => {
    throw new Error('Function not implemented.')
  }

  return (
    <Editor
      readOnly={readonly}
      valueRef={valueRef}
      fileUploader={handleUpload}
      classes={{
        ...classes,
        editor: classes.editorNoMinHeight,
      }}
      config={readonly ? { toolbar: `` } : undefined}
    />
  )
}