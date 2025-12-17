'use client'

import {
  GridColumn,
  GridRow,
  Input,
  Stack,
} from '@dmr.is/ui/components/island-is'
import { amountFormat } from '@dmr.is/utils/client'

type ReadOnlyAccordionItemProps = {
  id: string
  publicationNumber?: string
  createdAt: string
  createdBy: string
  paid?: boolean
  totalPrice?: number
}

export const AdvertReadonlyFields = ({
  id,
  publicationNumber,
  createdAt,
  createdBy,
  paid,
  totalPrice,
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
            placeholder="Reiknast við útgáfu"
            value={publicationNumber}
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
        <GridColumn span={['12/12', '6/12']}>
          <Input
            readOnly
            name="payment-status"
            size="sm"
            label="Greiðslustaða"
            defaultValue={paid ? 'Greitt' : 'Ógreitt'}
            icon={{ name: paid ? 'checkmark' : 'close', type: 'outline' }}
          />
        </GridColumn>
        {totalPrice ? (
          <GridColumn span={['12/12', '6/12']}>
            <Input
              readOnly
              name="price"
              size="sm"
              label="Verð"
              value={amountFormat(totalPrice)}
            />
          </GridColumn>
        ) : null}
      </GridRow>
    </Stack>
  )
}
