'use client'

import { GridColumn } from '@dmr.is/ui/components/island-is'

import { CategoryDto, TypeDto } from '../../../gen/fetch/models'
import { CategorySelect } from './CategoriesSelect'
import { TypeSelect } from './TypeSelect'

type Props = {
  typeId: string
  types: TypeDto[]
  onUpdateType: (typeId: string) => void
  categoryId: string
  categories: CategoryDto[]
  onUpdateCategory: (categoryId: string) => void
}

export const TypeAndCategorySelect = ({
  typeId,
  types,
  onUpdateType,
  categoryId,
  categories,
  onUpdateCategory,
}: Props) => {
  return (
    <>
      <GridColumn span={['12/12', '6/12']}>
        <TypeSelect types={types} selectedId={typeId} onSelect={onUpdateType} />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <CategorySelect
          categories={categories}
          selectedId={categoryId}
          onSelect={onUpdateCategory}
        />
      </GridColumn>
    </>
  )
}
