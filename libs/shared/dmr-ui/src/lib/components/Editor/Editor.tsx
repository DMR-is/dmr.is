import { FocusEvent, useCallback, useEffect, useRef } from 'react'

import type {
  EditorFileUploader,
  ToolbarItem,
} from '@dmr.is/regulations-tools/EditorV2'
import { EditorV2 } from '@dmr.is/regulations-tools/EditorV2'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { classes } from './Editor.css'

import '@dmr.is/regulations-tools/editorV2.css'

export type { ToolbarItem }

/**
 * Reading the value serializes the whole text, so onChange waits for a pause
 * in typing rather than firing on every keystroke.
 */
const CHANGE_DELAY_MS = 250

/**
 * No app here uploads files. The editor waits on one of the two callbacks, so
 * a pasted image must fail explicitly, or the paste never completes.
 */
const noUpload: EditorFileUploader = (_blobInfo, _success, failure) =>
  failure('File upload not supported')

type Props = {
  defaultValue?: HTMLText | string
  readonly?: boolean
  handleUpload?: EditorFileUploader
  toolbar?: Array<ToolbarItem>
  onChange?: (value: HTMLText) => void
  onBlur?: (value: HTMLText) => void
  disabled?: boolean
}

export const HTMLEditor = ({
  defaultValue = '',
  readonly = false,
  onChange,
  onBlur,
  handleUpload = noUpload,
  toolbar,
  disabled,
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

  // The editor's own dialogs and menus take focus, and EditorV2 reports that
  // as a blur. Only focus leaving the whole editor counts.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    flushChange()
    onBlur?.(valueRef.current())
  }

  return (
    <div onBlur={handleBlur}>
      <EditorV2
        disabled={disabled}
        readOnly={readonly}
        valueRef={valueRef}
        fileUploader={handleUpload}
        classes={classes}
        key={readonly ? 'readonly' : 'editable'}
        toolbar={readonly ? false : toolbar}
        onChange={handleChange}
      />
    </div>
  )
}
