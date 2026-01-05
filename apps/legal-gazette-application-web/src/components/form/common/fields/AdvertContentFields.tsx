'use client'

import { isBase64 } from 'class-validator'
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

  const defaultHTML = isBase64(fields?.html)
    ? Buffer.from(fields?.html ?? '', 'base64').toString('utf-8')
    : (fields?.html ?? '')

  const { debouncedUpdateApplication } = useUpdateApplication({
    id: metadata.applicationId,
    type: 'COMMON',
  })

  const error = formState.errors.fields?.html?.message

  return (
    <GridRow>
      <GridColumn span="12/12">
        <Editor
          error={error}
          defaultValue={defaultHTML}
          onChange={(val) => {
            clearErrors('fields.html')
            setValue('fields.html', val, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            })
            debouncedUpdateApplication(
              { fields: { html: Buffer.from(val).toString('base64') } },
              {
                successMessage: 'Meginmál vistað',
                errorMessage: 'Ekki tókst að vista meginmál',
              },
            )
          }}
        />
      </GridColumn>
    </GridRow>
  )
}
