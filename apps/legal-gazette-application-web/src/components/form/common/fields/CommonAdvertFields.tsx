'use client'

import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { CommonApplicationWebSchema } from '@dmr.is/legal-gazette-schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import {
  UpdateApplicationAnswers,
  useUpdateApplication,
} from '../../../../hooks/useUpdateApplication'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { InputController } from '../../controllers/InputController'
import { SelectController } from '../../controllers/SelectController'
export const CommonAdvertFields = () => {
  const trpc = useTRPC()
  const { control, getValues, setValue } =
    useFormContext<CommonApplicationWebSchema>()
  const metadata = getValues('metadata')

  // Watched rather than read via getValues so the effect below sees the current
  // selection instead of a snapshot taken at render time.
  const selectedType = useWatch({ control, name: 'fields.type' })
  const selectedCategory = useWatch({ control, name: 'fields.category' })

  const { updateLocalOnly } = useUpdateApplication({
    id: metadata.applicationId,
    type: 'COMMON',
  })

  const {
    data: categoriesData,
    isLoading,
    isPending,
  } = useQuery(
    trpc.getCategories.queryOptions(
      { typeId: selectedType?.id },
      { enabled: !!selectedType?.id },
    ),
  )

  /**
   * Keeps the selected category consistent with the selected type without ever
   * overwriting a valid choice made by the user.
   *
   * A type can be assignable to several categories and the backend returns them
   * ordered by title, so there is no such thing as "the" category of a type -
   * picking categories[0] would silently mislabel the advert. We therefore only
   * fill the category in when the type leaves no choice, and only clear it when
   * it is not assignable to the selected type (e.g. after changing type).
   */
  useEffect(() => {
    const categories = categoriesData?.categories
    if (!categories) return

    const isValidForType =
      !!selectedCategory?.id &&
      categories.some((category) => category.id === selectedCategory.id)

    if (isValidForType) return

    const newCategory = categories.length === 1 ? categories[0] : null

    // Nothing selected and nothing to auto-fill - leave it to the user.
    if (!newCategory && !selectedCategory?.id) return

    setValue('fields.category', newCategory)

    const payload: UpdateApplicationAnswers<'COMMON'>['fields'] = {
      category: newCategory,
    }

    updateLocalOnly({ fields: payload })
  }, [categoriesData?.categories, selectedCategory?.id])

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

              updateLocalOnly({ fields: { type: typeToUpdateTo } })
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
            placeholder="Veldu flokk"
            onChange={(val) => {
              const categoryToUpdateTo = categoriesData?.categories.find(
                (category) => category.id === val,
              )

              // The select is bound to fields.category.id, so without this the
              // denormalized title/slug would keep the previous category's values
              // and the summary step would show the wrong flokkur.
              setValue('fields.category', categoryToUpdateTo)

              return updateLocalOnly({
                fields: { category: categoryToUpdateTo },
              })
            }}
          />
        </GridColumn>
        <GridColumn span="12/12">
          <InputController
            name="fields.caption"
            label="Yfirskrift"
            required
            onChange={(val) => {
              // Save to localStorage only - server sync happens on blur / navigation
              updateLocalOnly({ fields: { caption: val } })
            }}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
