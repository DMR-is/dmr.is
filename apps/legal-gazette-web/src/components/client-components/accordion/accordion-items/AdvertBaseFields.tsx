'use client'

import { useParams } from 'next/navigation'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
  toast,
} from '@dmr.is/ui/components/island-is'

import { trpc } from '../../../../lib/trpc/client'

type Props = {
  title: string
  additionalText?: string
}

export const AdvertBaseFields = ({ title, additionalText }: Props) => {
  const id = useParams().id as string
  const { mutate: updateAdvert } = trpc.adverts.updateAdvert.useMutation()

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
            onBlur={(evt) =>
              updateAdvert(
                { id: id, title: evt.target.value },
                { onSuccess: () => toast.success('Titill vistaður') },
              )
            }
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
              updateAdvert(
                { id: id, additionalText: evt.target.value },
                { onSuccess: () => toast.success('Frjáls texti vistaður') },
              )
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
