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
  handleUpload?: EditorFileUploader
  toolbar?: Array<ToolbarItem>
  onChange?: (value: HTMLText) => void
  onBlur?: (value: HTMLText) => void
  disabled?: boolean
}

export const HTMLEditor = ({
  defaultValue = '',
  onChange,
  onBlur,
  handleUpload = noUpload,
  toolbar,
  disabled,
}: Props) => {
  const valueRef = useRef(() => defaultValue as HTMLText)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  const pendingChange = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hasFocus = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
    onBlurRef.current = onBlur
  }, [onChange, onBlur])

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

  const leave = useCallback(() => {
    if (!hasFocus.current) return
    hasFocus.current = false
    flushChange()
    onBlurRef.current?.(valueRef.current())
  }, [flushChange])

  // The editor's own dialogs and menus take focus, and EditorV2 reports that
  // as a blur. Only focus leaving the whole editor counts.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    leave()
  }

  // Focus can also leave with no blur at all: dismissing the table menu by
  // clicking outside it removes the focused menu button, and focus drops to
  // <body>. So the next interaction outside the editor counts as leaving it,
  // once that interaction has moved focus.
  useEffect(() => {
    const onOutside = (event: Event) => {
      const wrapper = wrapperRef.current
      if (!hasFocus.current || wrapper?.contains(event.target as Node)) return
      setTimeout(() => {
        if (!wrapper?.contains(document.activeElement)) leave()
      })
    }
    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('focusin', onOutside, true)
    return () => {
      document.removeEventListener('pointerdown', onOutside, true)
      document.removeEventListener('focusin', onOutside, true)
    }
  }, [leave])

  return (
    <div
      ref={wrapperRef}
      onFocus={() => {
        hasFocus.current = true
      }}
      onBlur={handleBlur}
    >
      <EditorV2
        disabled={disabled}
        valueRef={valueRef}
        fileUploader={handleUpload}
        classes={classes}
        toolbar={toolbar}
        onChange={handleChange}
      />
    </div>
  )
}
