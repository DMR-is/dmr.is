'use client'

import { GridColumn, Input, Stack, Text } from '@dmr.is/ui/components/island-is'

import { GridRow, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'

export const ReadOnlyFields = () => {
  const { advert } = useAdvertContext()
  return (
    <Stack space={[2, 3]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Upplýsingar um auglýsingu</Text>
        </GridColumn>
      </GridRow>
      <GridRow>
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
            name="createdBy"
            size="sm"
            label="Innsendandi"
            defaultValue={advert.createdBy}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
