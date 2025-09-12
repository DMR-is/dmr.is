'use client'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { TypeAndCategorySelect } from '../../selects/TypeAndCategorySelect'

export const BaseAdvertFields = () => {
  const { advert, types, categories } = useAdvertContext()

  return (
    <Stack space={[2, 3]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Almennar upplýsingar</Text>
        </GridColumn>
      </GridRow>
      <GridRow>
        <TypeAndCategorySelect
          advertId={advert.id}
          initalTypeId={advert.type.id}
          initalCategoryId={advert.category.id}
          types={types}
          initalCategories={categories}
        />
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Input
            name="title"
            size="sm"
            backgroundColor="blue"
            label="Titill"
            defaultValue={advert.title}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
