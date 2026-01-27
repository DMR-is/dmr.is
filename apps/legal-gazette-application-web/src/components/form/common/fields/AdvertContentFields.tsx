'use client'

import { isBase64 } from 'class-validator'
import { useEffect, useRef, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { CommonApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { Editor } from '../../../editor/Editor'

export const AdvertContentField = () => {
  const { getValues, setValue, clearErrors, watch, formState } =
    useFormContext<CommonApplicationWebSchema>()
  const metadata = getValues('metadata')

  const fields = watch('fields')

  // Track the initial value for the Editor key - this ensures the Editor
  // remounts when localStorage hydration changes the value
  const [editorKey, setEditorKey] = useState(0)
  const previousHtmlRef = useRef<string | null | undefined>(undefined)
  // Track when changes come from user typing vs external hydration
  const isInternalChangeRef = useRef(false)

  const defaultHTML = isBase64(fields?.html)
    ? Buffer.from(fields?.html ?? '', 'base64').toString('utf-8')
    : (fields?.html ?? '')

  // When the HTML value changes from external source (localStorage hydration),
  // increment the key to force Editor remount. Skip for internal changes (user typing).
  useEffect(() => {
    // If the change came from the Editor's onChange, don't remount
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false
      previousHtmlRef.current = fields?.html
      return
    }

    // Only update key if the value changed and we have a previous value to compare
    // This prevents unnecessary remounts during normal editing
    if (
      previousHtmlRef.current !== undefined &&
      previousHtmlRef.current !== fields?.html
    ) {
      setEditorKey((prev) => prev + 1)
    }
    previousHtmlRef.current = fields?.html
  }, [fields?.html])

  const { updateLocalOnly } = useUpdateApplication({
    id: metadata.applicationId,
    type: 'COMMON',
  })

  const error = formState.errors.fields?.html?.message

  return (
    <GridRow>
      <GridColumn span="12/12">
        <Editor
          key={editorKey}
          error={error}
          defaultValue={defaultHTML}
          onChange={(val) => {
            // Mark as internal change to prevent Editor remount
            isInternalChangeRef.current = true
            clearErrors('fields.html')
            setValue('fields.html', val, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            })
            // Save to localStorage only - server sync happens on navigation
            updateLocalOnly({
              fields: { html: Buffer.from(val).toString('base64') },
            })
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
