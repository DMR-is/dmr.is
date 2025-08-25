'use client'

import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import {
  CommonFormFields,
  CommonFormSchema,
} from '../../../../../lib/forms/schemas/common-schema'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const { getValues, setValue } = useFormContext<CommonFormSchema>()

  const categories = getValues('meta.categoryOptions')

  const { trigger } = useUpdateApplication({
    applicationId: getValues('meta.applicationId'),
  })

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <SelectController
            required
            options={categories}
            name={CommonFormFields.CATEGORY}
            label="Flokkur"
            onChange={(val) => trigger({ categoryId: val })}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name={CommonFormFields.CAPTION}
            label="Yfirskrift"
            required
            onBlur={(val) => trigger({ caption: val })}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <Text marginBottom={1} variant="h3">
            Meginmál
          </Text>
          <Editor
            defaultValue={Buffer.from(
              getValues('fields.html'),
              'base64',
            ).toString('utf-8')}
            onBlur={(val) => {
              setValue('fields.html', val)
              trigger({ html: Buffer.from(val).toString('base64') })
            }}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
