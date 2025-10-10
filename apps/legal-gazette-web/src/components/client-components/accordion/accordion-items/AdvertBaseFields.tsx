import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { CategoryDto, TypeDto } from '../../../../gen/fetch'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import { CategorySelect } from '../../selects/CategoriesSelect'
import { TypeSelect } from '../../selects/TypeSelect'

type Props = {
  id: string
  types: TypeDto[]
  categories: CategoryDto[]
  typeId: string
  categoryId: string
  title: string
  additionalText?: string
}

export const AdvertBaseFields = ({
  id,
  types,
  categories,
  typeId,
  categoryId,
  title,
  additionalText,
}: Props) => {
  const { updateType, updateCategory, updateTitle, updateAdditionalText } =
    useUpdateAdvert(id)

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <TypeSelect
            types={types.map((t) => t)}
            selectedId={typeId}
            onSelect={(id) => updateType(id ?? '')}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <CategorySelect
            selectedId={categoryId}
            onSelect={(id) => updateCategory(id ?? '')}
            categories={categories}
            isLoading={false}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Input
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
