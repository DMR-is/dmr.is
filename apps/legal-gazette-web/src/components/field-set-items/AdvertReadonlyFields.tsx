'use client'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'

type ReadOnlyAccordionItemProps = {
  id: string
  publicationNumber: string | null
  createdAt: string
  createdBy: string
}

export const AdvertReadonlyFields = ({
  id,
  publicationNumber,
  createdAt,
  createdBy,
}: ReadOnlyAccordionItemProps) => {
  return (
    <Stack space={[1, 2]}>
      <GridRow rowGap={[1, 2]}>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            readOnly
            name="id"
            size="sm"
            label="Auðkenni auglýsingar"
            buttons={[
              {
                name: 'copy',
                label: 'Afrita',
                type: 'outline',
                onClick: () => navigator.clipboard.writeText(id),
              },
            ]}
            value={id}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            readOnly
            name="publicationNumber"
            size="sm"
            label="Útgáfunúmer"
            value={publicationNumber ?? 'Reiknast við útgáfu'}
            buttons={
              publicationNumber
                ? [
                    {
                      name: 'copy',
                      label: 'Afrita',
                      type: 'outline',
                      onClick: () =>
                        navigator.clipboard.writeText(publicationNumber),
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
            value={createdAt}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            readOnly
            name="createdBy"
            size="sm"
            label="Innsendandi"
            defaultValue={createdBy}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
