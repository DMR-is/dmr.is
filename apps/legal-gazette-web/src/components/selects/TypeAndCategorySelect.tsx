import { GridColumn } from '@dmr.is/ui/components/island-is'

import { CategoryDto, TypeDto } from '../../gen/fetch/models'
import { CategorySelect } from './CategorySelect'
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
  onUpdateType,
  categoryId,
  onUpdateCategory,
}: Props) => {
  return (
    <>
      <GridColumn span={['12/12', '6/12']}>
        <TypeSelect
          selectedId={typeId}
          onSelect={(type) => {
            if (!type) return
            return onUpdateType(type.id)
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <CategorySelect
          selectedId={categoryId}
          onSelect={(category) => {
            if (!category) return
            return onUpdateCategory(category.id)
          }}
        />
      </GridColumn>
    </>
  )
}
