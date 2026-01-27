'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Pagination,
  Stack,
} from '@dmr.is/ui/components/island-is'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

import { Paging } from '../../gen/fetch'
import { AdvertCard, AdvertCardData } from './AdvertCard'

type Props = {
  adverts: AdvertCardData[]
  paging: Paging
  onPageChange?: (page: number) => void
}

export const OldAdvertsList = ({ adverts, paging, onPageChange }: Props) => {
  return (
    <>
      <GridContainer>
        <GridRow marginTop={1} marginBottom={8}>
          <GridColumn
            span={['12/12', '12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '0', '1/12']}
          >
            <Box marginBottom={2}>
              {' '}
              <PagingTotalItemsText
                paging={paging}
                totalItems={paging?.totalItems}
              />
            </Box>
            <Stack space={[2, 3]}>
              {adverts.map((advert) => (
                <AdvertCard advert={advert} key={advert.id} />
              ))}

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
    </>
  )
}
