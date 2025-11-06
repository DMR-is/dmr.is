'use client'

import { useQueryState } from 'next-usequerystate'

import { parseAsInteger } from 'nuqs/server'

import { Pagination } from '@dmr.is/ui/components/island-is'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ApplicationDto, Paging } from '../../../gen/fetch'
import { ApplicationCard } from './ApplicationCard'

type Props = {
  applications: ApplicationDto[]
  paging: Paging
}

export const ApplicationList = ({ applications, paging }: Props) => {
  const [_page, setPage] = useQueryState('page', parseAsInteger)

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={[2, 3, 4]}>
            <Text variant="h2">Mínar umsóknir</Text>
            {applications.map((application, i) => (
              <ApplicationCard application={application} key={i} />
            ))}
            {applications.length === 0 && (
              <Text>Þú hefur ekki skráð neinar umsóknir ennþá.</Text>
            )}
            {paging.totalPages > 1 && (
              <Pagination
                page={paging.page}
                itemsPerPage={paging.pageSize}
                totalItems={paging.totalItems}
                totalPages={paging.totalPages}
                renderLink={(page, className, children) => (
                  <button className={className} onClick={() => setPage(page)}>
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
