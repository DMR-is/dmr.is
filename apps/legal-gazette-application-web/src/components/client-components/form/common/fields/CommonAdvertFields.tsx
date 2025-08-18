'use client'

import { useFormContext } from 'react-hook-form'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { CommonFormSchema } from '../../../../../lib/forms/schemas/common-schema'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const { getValues, setValue } = useFormContext<CommonFormSchema>()

  const categories = getValues('meta.categoryOptions')

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <SelectController
            required
            options={categories}
            name="category"
            label="Flokkur"
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController name="caption" label="Yfirskrift" required />
        </GridColumn>
        <GridColumn span="12/12">
          <Text marginBottom={1} variant="h3">
            Meginmál
          </Text>
          <Editor onChange={(val) => setValue('fields.html', val)} />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
