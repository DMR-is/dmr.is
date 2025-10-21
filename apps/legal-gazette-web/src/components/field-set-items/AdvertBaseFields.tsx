import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { CategoryDto, TypeDto } from '../../gen/fetch'
import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { CategorySelect } from '../selects/CategorySelect'
import { TypeSelect } from '../selects/TypeSelect'

type Props = {
  id: string
  canEdit?: boolean
  types: TypeDto[]
  categories: CategoryDto[]
  typeId: string
  categoryId: string
  title: string
  additionalText?: string
}

export const AdvertBaseFields = ({
  id,
  canEdit = false,
  types,
  categories,
  typeId,
  categoryId,
  title,
  additionalText,
}: Props) => {
  const {
    updateType,
    updateCategory,
    updateTitle,
    updateAdditionalText,
    isUpdatingAdvert,
  } = useUpdateAdvert(id)

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <TypeSelect
            disabled={!canEdit}
            types={types.map((t) => t)}
            selectedId={typeId}
            onSelect={(id) => updateType(id ?? '')}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <CategorySelect
            disabled={!canEdit}
            selectedId={categoryId}
            onSelect={(id) => updateCategory(id ?? '')}
            categories={categories}
            isLoading={isUpdatingAdvert}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Input
            disabled={!canEdit}
            name="title"
            size="sm"
            backgroundColor="blue"
            label="Titill"
            defaultValue={title}
            onBlur={(evt) => updateTitle(evt.target.value)}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Input
            disabled={!canEdit}
            name="additionalText"
            size="sm"
            backgroundColor="blue"
            label="Frjáls texti"
            textarea
            defaultValue={additionalText}
            onBlur={(evt) =>
              updateAdditionalText({ additionalText: evt.target.value })
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
