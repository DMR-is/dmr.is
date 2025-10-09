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

export const AdvertBaseFields = ({ title, additionalText }: Props) => {
  const id = useParams().id as string
  const updateAdvert = trpc.adverts.updateAdvert.useMutation({
    onMutate: async (variables) => {
      const prevData = utils.adverts.getAdvert.getData({
        id: variables.id,
      })

      return prevData
    },
  })
  const utils = trpc.useUtils()

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
            onBlur={(evt) => {
              if (evt.target.value === title) {
                return
              }
              updateAdvert.mutate(
                { id: id, title: evt.target.value },
                {
                  onSuccess: (_data, _variables, mutateResults) => {
                    if (mutateResults?.title === evt.target.value) {
                      return
                    }
                    toast.success('Titill vistaður')
                    utils.adverts.getAdvert.invalidate({ id: id })
                  },
                },
              )
            }}
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
            onBlur={(evt) => {
              if (evt.target.value === additionalText) {
                return
              }
              updateAdvert.mutate(
                { id: id, additionalText: evt.target.value },
                {
                  onSuccess: (_data, _variables, mutateResults) => {
                    if (mutateResults?.additionalText === evt.target.value) {
                      return
                    }
                    toast.success('Frjáls texti vistaður')
                    utils.adverts.getAdvert.invalidate({ id: id })
                  },
                },
              )
            }}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
