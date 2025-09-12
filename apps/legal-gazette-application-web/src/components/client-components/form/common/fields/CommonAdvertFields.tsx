'use client'

import { useFormContext } from 'react-hook-form'
import useSWR from 'swr'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { getCategories } from '../../../../../lib/fetchers'
import {
  CommonFormFields,
  CommonFormSchema,
} from '../../../../../lib/forms/schemas/common-schema'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const { getValues, setValue, watch } = useFormContext<CommonFormSchema>()

  const { typeOptions } = getValues('meta')

  const { trigger } = useUpdateApplication({
    applicationId: getValues('meta.applicationId'),
  })

  const typeId = watch('fields.type')
  const categoryId = watch('fields.category')

  const { data, isLoading } = useSWR(
    typeId ? ['getCategories', typeId] : null,
    ([_key, type]) => getCategories({ type }),
    {
      onSuccess: (data) => {
        if (data.categories.length === 1) {
          setValue(CommonFormFields.CATEGORY, data.categories[0].id)
          return trigger({ categoryId: data.categories[0].id })
        }

        setValue(CommonFormFields.CATEGORY, '')
        return trigger({ categoryId: null })
      },
    },
  )

  const categoryOptions =
    data?.categories.map((category) => ({
      label: category.title,
      value: category.id,
    })) ?? []

  const disabledCategories =
    categoryOptions.length === 0 || categoryOptions.length === 1 || isLoading

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            options={typeOptions}
            name={CommonFormFields.TYPE}
            label="Tegund auglýsingar"
            onChange={(val) => trigger({ typeId: val })}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            key={`${typeId}-${categoryId}`}
            disabled={disabledCategories}
            options={categoryOptions}
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
            defaultValue={getValues('fields.html')}
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
