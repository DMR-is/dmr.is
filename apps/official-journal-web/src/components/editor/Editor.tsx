import { useCallback, useEffect, useRef } from 'react'

import type { EditorFileUploader } from '@dmr.is/regulations-tools/EditorV2'
import { EditorV2 } from '@dmr.is/regulations-tools/EditorV2'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { classes } from './Editor.css'

import '@dmr.is/regulations-tools/editorV2.css'

/**
 * Reading the value serializes the whole text, which on long adverts costs
 * more than the keystroke itself, so onChange waits for a pause in typing.
 */
const CHANGE_DELAY_MS = 250

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
  const onChangeRef = useRef(onChange)
  const pendingChange = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const flushChange = useCallback(() => {
    if (pendingChange.current === undefined) return
    clearTimeout(pendingChange.current)
    pendingChange.current = undefined
    onChangeRef.current?.(valueRef.current())
  }, [])

  // Unmounting must not drop the last edit
  useEffect(() => flushChange, [flushChange])

  const handleChange = () => {
    clearTimeout(pendingChange.current)
    pendingChange.current = setTimeout(flushChange, CHANGE_DELAY_MS)
  }

  const handleBlur = () => {
    flushChange()
    onBlur?.(valueRef.current())
  }

  return (
    <EditorV2
      readOnly={readonly}
      valueRef={valueRef}
      fileUploader={handleUpload}
      classes={classes}
      key={readonly ? 'readonly' : 'editable'}
      toolbar={readonly ? false : undefined}
      disabledWarnings={['nonEmTitleContent']}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
