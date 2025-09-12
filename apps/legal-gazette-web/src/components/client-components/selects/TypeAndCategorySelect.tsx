'use client'

import { useState } from 'react'
import useSWR from 'swr'

import { GridColumn } from '@dmr.is/ui/components/island-is'

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

        return setSelectedCategoryId(categories[0].id)
      },
    },
  )

  const handleCategoryChange = (categoryId?: string) => {
    setSelectedCategoryId(categoryId)
    trigger({ categoryId: categoryId })
  }

  const handleTypeChange = (typeId?: string) => {
    if (!typeId) throw new Error('Type is required')
    setSelectedTypeId(typeId)
    if (!hasTypeChanged) {
      setHasTypeChanged(true)
    }
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
