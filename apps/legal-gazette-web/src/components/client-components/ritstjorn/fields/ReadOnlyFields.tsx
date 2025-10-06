'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { GridColumn, Input, Stack } from '@dmr.is/ui/components/island-is'

import { AccordionItem, GridRow, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'

export const ReadOnlyFields = () => {
  const { advert } = useAdvertContext()

  return (
    <AccordionItem id="readonly" label="Upplýsingar um auglýsingu">
      <Stack space={[1, 2]}>
        <GridRow rowGap={[1, 2]}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              readOnly
              name="id"
              size="sm"
              label="Auðkenni auglýsingar"
              defaultValue={advert.id}
              buttons={[
                {
                  name: 'copy',
                  label: 'Afrita',
                  type: 'outline',
                  onClick: () => {
                    navigator.clipboard.writeText(advert.id)
                    toast.info('Auðkenni afritað', {
                      toastId: 'copyId',
                    })
                  },
                },
              ]}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              readOnly
              name="publicationNumber"
              size="sm"
              label="Útgáfunúmer"
              value={advert.publicationNumber ?? 'Reiknast við útgáfu'}
              buttons={
                advert.publicationNumber
                  ? [
                      {
                        name: 'copy',
                        label: 'Afrita',
                        type: 'outline',
                        onClick: () => {
                          navigator.clipboard.writeText(advert.createdBy)
                          toast.info('Útgáfunúmer afritað', {
                            toastId: 'copyCreatedBy',
                          })
                        },
                      },
                    ]
                  : undefined
              }
            />
          </GridColumn>

          <GridColumn span={['12/12', '6/12']}>
            <Input
              readOnly
              name="createdAt"
              size="sm"
              label="Dagsetning innsendingar"
              value={format(new Date(advert.createdAt), 'dd. MMMM yyyy', {
                locale: is,
              })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              readOnly
              name="createdBy"
              size="sm"
              label="Innsendandi"
              defaultValue={advert.createdBy}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </AccordionItem>
  )
}
