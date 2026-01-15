'use client'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Pagination,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Paging } from '../../gen/fetch'
import { AdvertCard, AdvertCardData } from './AdvertCard'

type Props = {
  adverts: AdvertCardData[]
  paging: Paging
  onPageChange?: (page: number) => void
}

export const OldAdvertsList = ({ adverts, paging, onPageChange }: Props) => {
  return (
    <GridContainer>
      <GridRow marginTop={3} marginBottom={8}>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={[2, 3, 4]}>
            {adverts.map((advert) => (
              <AdvertCard advert={advert} key={advert.id} />
            ))}
            {adverts.length === 0 && (
              <Text variant="intro">Engar eldri auglýsingar fundust.</Text>
            )}
            {paging.totalPages > 1 && (
              <Pagination
                page={paging.page}
                itemsPerPage={paging.pageSize}
                totalItems={paging.totalItems}
                totalPages={paging.totalPages}
                renderLink={(page, className, children) => (
                  <button
                    className={className}
                    onClick={() => onPageChange?.(page)}
                  >
                    {children}
                  </button>
                )}
              />
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
