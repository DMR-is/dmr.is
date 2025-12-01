'use client'

import debounce from 'lodash/debounce'
import { useCallback, useEffect } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'

import { CommonApplicationInputFields } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  GridColumn,
  GridRow,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

import { ApplicationTypeEnum } from '../../../../gen/fetch'
import { useUpdateApplicationJson } from '../../../../hooks/useUpdateApplicationJson'
import { CommonApplicationWebSchema } from '../../../../lib/forms/common-form'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { Editor } from '../../../editor/Editor'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const trpc = useTRPC()
  const { getValues, setValue, watch } =
    useFormContext<CommonApplicationWebSchema>()
  const formState = useFormState()
  const metadata = getValues('metadata')

  const typeId = watch('fields.typeId')
  const categoryId = watch('fields.categoryId')

  const { updateApplicationJson } = useUpdateApplicationJson({
    id: metadata.applicationId,
    type: ApplicationTypeEnum.COMMON,
  })

  const {
    data: categoriesData,
    isLoading,
    isPending,
  } = useQuery(
    trpc.getCategories.queryOptions({ typeId: typeId! }, { enabled: !!typeId }),
  )

  useEffect(() => {
    if (!categoriesData?.categories || !formState.isDirty) return

    if (categoriesData?.categories.length === 1) {
      setValue('fields.categoryId', categoriesData.categories[0].id)

      return updateApplicationJson({
        fields: { categoryId: categoriesData.categories[0].id },
      })
    }

    setValue('fields.categoryId', null)
    return updateApplicationJson({ fields: { categoryId: null } })
  }, [categoriesData?.categories, formState.isDirty])

  // const updateHtmlOnBlurHandler = useCallback(
  //   (val: string) => {
  //     setValue('fields.html', val, {
  //       shouldValidate: true,
  //       shouldDirty: true,
  //       shouldTouch: true,
  //     })
  //     updateHTML(val)
  //   },
  //   [setValue, updateHTML],
  // )

  // const updateHtmlOnChangeHandler = useCallback(
  //   debounce((val: string) => {
  //     setValue('fields.html', val, {
  //       shouldValidate: true,
  //       shouldDirty: true,
  //       shouldTouch: true,
  //     })
  //     updateHTML(val)
  //   }, 500),
  //   [setValue, updateHTML],
  // )

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
      <Text variant="h4">Grunnupplýsingar</Text>
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            options={metadata.typeOptions}
            name={'fields.typeId'}
            label="Tegund auglýsingar"
            onChange={(val) =>
              updateApplicationJson(
                { fields: { typeId: val } },
                {
                  onSuccess: () => {
                    toast.success('Tegund auglýsingar uppfærð')
                  },
                  onError: () => {
                    toast.error('Ekki tókst að uppfæra tegund auglýsingar')
                  },
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            disabled={disabledCategories}
            options={categoryOptions}
            name={'fields.categoryId'}
            label="Flokkur"
            onChange={(val) =>
              updateApplicationJson({ fields: { categoryId: val } })
            }
          />
        </GridColumn>
        {/*<GridColumn span="12/12">
          <InputController
            name={CommonApplicationInputFields.CAPTION}
            label="Yfirskrift"
            required
            onBlur={(val) => updateCaption(val)}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <Text marginBottom={1} variant="h4">
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
        </GridColumn> */}
      </GridRow>
    </Stack>
  )
}
