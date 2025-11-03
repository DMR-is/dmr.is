'use client'

import debounce from 'lodash/debounce'
import { useCallback, useEffect } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'

import {
  CommonApplicationInputFields,
  CommonApplicationSchema,
} from '@dmr.is/legal-gazette/schemas'

import { GridColumn, GridRow, Stack, Text } from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { trpc } from '../../../../../lib/trpc/client'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const { getValues, setValue, watch } =
    useFormContext<CommonApplicationSchema>()
  const formState = useFormState()

  const metadata = getValues('metadata')

  const { updateType, updateCategory, updateCaption, updateHTML } =
    useUpdateApplication(metadata.applicationId)

  const typeId = watch(CommonApplicationInputFields.TYPE)
  const categoryId = watch(CommonApplicationInputFields.CATEGORY)

  const {
    data: categoriesData,
    isLoading,
    isPending,
  } = trpc.applicationApi.getCategories.useQuery(
    { typeId: typeId },
    { enabled: !!typeId },
  )

  useEffect(() => {
    if (!categoriesData?.categories || !formState.isDirty) return

    if (categoriesData.categories.length === 1) {
      setValue(
        CommonApplicationInputFields.CATEGORY,
        categoriesData.categories[0].id,
      )
      updateCategory(categoriesData.categories[0].id)
    }
  }, [categoriesData?.categories, formState.isDirty])

  const updateHtmlOnBlurHandler = useCallback(
    (val: string) => {
      console.log('onBlur', val)
      setValue('fields.html', val, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      updateHTML(val)
    },
    [setValue, updateHTML],
  )

  const updateHtmlOnChangeHandler = useCallback(
    debounce((val: string) => {
      setValue('fields.html', val, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      updateHTML(val)
    }, 500),
    [setValue, updateHTML],
  )

  const categoryOptions =
    categoriesData?.categories.map((category) => ({
      label: category.title,
      value: category.id,
    })) ?? []

  const disabledCategories =
    categoryOptions.length === 0 ||
    categoryOptions.length === 1 ||
    isLoading ||
    isPending

  return (
    <Stack space={[1, 2]}>
      <Text variant="h3">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            options={metadata.typeOptions}
            name={CommonApplicationInputFields.TYPE}
            label="Tegund auglýsingar"
            onChange={(val) => updateType(val)}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            key={`${typeId}-${categoryId}`}
            disabled={disabledCategories}
            options={categoryOptions}
            name={CommonApplicationInputFields.CATEGORY}
            label="Flokkur"
            onChange={(val) => updateCategory(val)}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name={CommonApplicationInputFields.CAPTION}
            label="Yfirskrift"
            required
            onBlur={(val) => updateCaption(val)}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <Text marginBottom={1} variant="h3">
            Meginmál
          </Text>
          <Editor
            defaultValue={getValues('fields.html')}
            onChange={(val) => {
              updateHtmlOnChangeHandler.cancel()
              updateHtmlOnChangeHandler(val)
            }}
            onBlur={updateHtmlOnBlurHandler}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
