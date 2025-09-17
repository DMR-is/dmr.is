'use client'

import { useState } from 'react'
import useSWR from 'swr'

import { GridColumn } from '@dmr.is/ui/components/island-is'

import { toast } from '@island.is/island-ui/core'

import { CategoryDto, TypeDto } from '../../../gen/fetch'
import { useClient } from '../../../hooks/useClient'
import { useUpdateAdvert } from '../../../hooks/useUpdateAdvert'
import { CategorySelect } from './CategoriesSelect'
import { TypeSelect } from './TypeSelect'

type Props = {
  advertId: string
  initalTypeId: string
  initalCategoryId?: string
  types: TypeDto[]
  initalCategories: CategoryDto[]
}

export const TypeAndCategorySelect = ({
  advertId,
  initalTypeId,
  initalCategoryId,
  types,
  initalCategories,
}: Props) => {
  const client = useClient('CategoryApi')

  const [selectedTypeId, setSelectedTypeId] = useState(initalTypeId)
  const [hasTypeChanged, setHasTypeChanged] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(initalCategoryId)

  const { trigger } = useUpdateAdvert(advertId)

  const { data, isLoading } = useSWR(
    selectedTypeId ? ['getCategoriesByType', selectedTypeId] : null,
    ([_key, type]) => client.getCategories({ type }),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      fallbackData: { categories: initalCategories },
      onSuccess: ({ categories }) => {
        if (!hasTypeChanged) return

        if (categories.length === 0) {
          throw new Error('No categories found for type')
        }

        const cat = categories[0].id
        setSelectedCategoryId(cat)
        trigger({ categoryId: cat })
      },
    },
  )

  const handleCategoryChange = (categoryId?: string) => {
    setSelectedCategoryId(categoryId)
    trigger(
      { categoryId: categoryId },
      {
        onSuccess: () => {
          toast.success('Flokkur vistaður', { toastId: 'save-category' })
        },
        onError: () => {
          toast.error('Ekki tókst að uppfæra flokk', {
            toastId: 'error-category',
          })
        },
      },
    )
  }

  const handleTypeChange = (typeId?: string) => {
    if (!typeId) throw new Error('Type is required')
    setSelectedTypeId(typeId)

    if (!hasTypeChanged) {
      setHasTypeChanged(true)
    }

    trigger(
      { typeId: typeId },
      {
        onSuccess: () => {
          toast.success('Tegund vistaður', { toastId: 'save-type' })
        },
        onError: () => {
          toast.error('Ekki tókst að uppfæra tegund', { toastId: 'error-type' })
        },
      },
    )
  }

  return (
    <>
      <GridColumn span={['12/12', '6/12']}>
        <TypeSelect
          types={types.map((t) => t)}
          selectedId={selectedTypeId}
          onSelect={handleTypeChange}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <CategorySelect
          selectedId={selectedCategoryId}
          onSelect={handleCategoryChange}
          categories={data.categories}
          isLoading={isLoading}
        />
      </GridColumn>
    </>
  )
}
