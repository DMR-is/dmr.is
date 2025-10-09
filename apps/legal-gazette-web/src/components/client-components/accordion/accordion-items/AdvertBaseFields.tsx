import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import type { UpdateAdvertDto } from '../../../../lib/trpc/server/routers/advertsRouter'

type Props = {
  id: string
  title: string
  additionalText?: string
  onUpdate: (data: UpdateAdvertDto) => void
}

export const AdvertBaseFields = ({
  id,
  title,
  additionalText,
  onUpdate,
}: Props) => {
  return (
    <Stack space={[1, 2]}>
      <GridRow>
        {/* <TypeAndCategorySelect
          advertId={advert.id}
          initalTypeId={advert.type.id}
          initalCategoryId={advert.category.id}
          types={data?.categories ?? []}
          initalCategories={data?.categories ?? []}
        /> */}
      </GridRow>
      <GridRow>
        <GridColumn span="12/12">
          <Input
            name="title"
            size="sm"
            backgroundColor="blue"
            label="Titill"
            defaultValue={title}
            onBlur={(evt) => onUpdate({ id: id, title: evt.target.value })}
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
              onUpdate({ id: id, additionalText: evt.target.value })
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
