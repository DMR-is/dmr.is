'use client'

import { isBase64 } from 'class-validator'
import { useFormContext } from 'react-hook-form'

import { CommonApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { GridColumn, GridRow } from '@dmr.is/ui/components/island-is'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'
import { Editor } from '../../../editor/Editor'

export const AdvertContentField = () => {
  const { getValues, setValue, watch } =
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

  return (
    <GridRow>
      <GridColumn span="12/12">
        <Editor
          defaultValue={defaultHTML}
          onChange={(val) => {
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
