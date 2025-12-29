'use client'

import { useEffect } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'

import { CommonApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn, GridRow, Stack } from '@dmr.is/ui/components/island-is'

import {
  UpdateApplicationAnswers,
  useUpdateApplication,
} from '../../../../hooks/useUpdateApplication'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const trpc = useTRPC()
  const { getValues, setValue } = useFormContext<CommonApplicationWebSchema>()
  const formState = useFormState()
  const metadata = getValues('metadata')

  const fieldValues = getValues('fields')

  const { updateApplication, debouncedUpdateApplication } =
    useUpdateApplication({
      id: metadata.applicationId,
      type: 'COMMON',
    })

  const {
    data: categoriesData,
    isLoading,
    isPending,
  } = useQuery(
    trpc.getCategories.queryOptions(
      { typeId: fieldValues?.type?.id },
      { enabled: !!fieldValues?.type?.id },
    ),
  )

  useEffect(() => {
    if (!categoriesData?.categories || !formState.isDirty) return

    const newCategory = categoriesData.categories[0]
    if (newCategory.id === fieldValues?.category?.id) return

    setValue('fields.category', newCategory)

    const payload: UpdateApplicationAnswers<'COMMON'>['fields'] = {
      category: newCategory,
    }

    updateApplication(
      { fields: payload },
      {
        successMessage: 'Tegund auglýsingar vistuð',
        errorMessage: 'Ekki tókst að vista tegund auglýsingar',
      },
    )
  }, [categoriesData?.categories, formState.isDirty])

  const typeOptions = metadata.typeOptions.map((typeOption) => ({
    label: typeOption.label,
    value: typeOption.value.id,
  }))

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
      <GridRow rowGap={[2, 3]}>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            options={typeOptions}
            name="fields.type.id"
            label="Tegund auglýsingar"
            onChange={(val) => {
              const typeToUpdateTo = metadata.typeOptions.find(
                (typeOption) => typeOption.value.id === val,
              )?.value

              setValue('fields.type', typeToUpdateTo)

              updateApplication(
                { fields: { type: typeToUpdateTo } },
                {
                  successMessage: 'Tegund auglýsingar vistuð',
                  errorMessage: 'Ekki tókst að vista tegund auglýsingar',
                },
              )
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <SelectController
            required
            disabled={disabledCategories}
            options={categoryOptions}
            name={'fields.category.id'}
            label="Flokkur"
            onChange={(val) => {
              const categoryToUpdateTo = categoriesData?.categories.find(
                (category) => category.id === val,
              )
              return updateApplication(
                { fields: { category: categoryToUpdateTo } },
                {
                  successMessage: 'Flokkur vistaður',
                  errorMessage: 'Ekki tókst að vista flokk',
                },
              )
            }}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name="fields.caption"
            label="Yfirskrift"
            required
            onChange={(val) =>
              debouncedUpdateApplication(
                { fields: { caption: val } },
                {
                  successMessage: 'Yfirskrift vistuð',
                  errorMessage: 'Ekki tókst að vista yfirskrift',
                },
              )
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
