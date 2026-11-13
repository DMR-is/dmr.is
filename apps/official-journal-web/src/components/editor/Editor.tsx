import { FocusEvent, useCallback, useEffect, useRef } from 'react'

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
    let focusCheck: ReturnType<typeof setTimeout> | undefined
    const onOutside = (event: Event) => {
      const wrapper = wrapperRef.current
      if (!hasFocus.current || wrapper?.contains(event.target as Node)) return
      clearTimeout(focusCheck)
      focusCheck = setTimeout(() => {
        if (!wrapper?.contains(document.activeElement)) leave()
      })
    }
    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('focusin', onOutside, true)
    return () => {
      clearTimeout(focusCheck)
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
        readOnly={readonly}
        valueRef={valueRef}
        fileUploader={handleUpload}
        classes={classes}
        key={readonly ? 'readonly' : 'editable'}
        toolbar={readonly ? false : undefined}
        disabledWarnings={['nonEmTitleContent']}
        onChange={handleChange}
      />
    </div>
  )
}
