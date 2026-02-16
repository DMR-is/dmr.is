import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'
import { CategorySelect } from '../selects/CategorySelect'
import { TypeSelect } from '../selects/TypeSelect'

type Props = {
  id: string
  canEdit?: boolean
  selectedTypeId: string
  selectedCategoryId: string
  title: string
  additionalText?: string
}

export const AdvertBaseFields = ({
  id,
  canEdit = false,
  selectedTypeId,
  selectedCategoryId,
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
            selectedId={selectedTypeId}
            onSelect={(type) => updateType(type?.id ?? '')}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <CategorySelect
            disabled={!canEdit}
            selectedId={selectedCategoryId}
            typeId={selectedTypeId}
            onSelect={(category) => updateCategory(category?.id ?? '')}
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
