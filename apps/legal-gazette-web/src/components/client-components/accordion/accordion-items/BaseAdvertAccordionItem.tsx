'use client'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AccordionItem, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import { TypeAndCategorySelect } from '../../selects/TypeAndCategorySelect'

export const BaseAdvertAccordionItem = () => {
  const { advert, types, categories } = useAdvertContext()

  const { trigger } = useUpdateAdvert(advert.id)

  return (
    <AccordionItem
      id="base"
      label="Almennar upplýsingar"
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={[1, 2]}>
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
              onBlur={(evt) =>
                trigger(
                  { title: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Titill vistaður', {
                        toastId: 'save-title',
                      })
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra titil', {
                        toastId: 'error-title',
                      })
                    },
                  },
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
              defaultValue={advert.additionalText ?? ''}
              onBlur={(evt) =>
                trigger(
                  { additionalText: evt.target.value },
                  {
                    onSuccess: () => {
                      toast.success('Frjáls texti vistaður', {
                        toastId: 'save-additionalText',
                      })
                    },
                    onError: () => {
                      toast.error('Ekki tókst að uppfæra frjálsan texta', {
                        toastId: 'error-additionalText',
                      })
                    },
                  },
                )
              }
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </AccordionItem>
  )
}
