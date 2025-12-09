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
} from '@dmr.is/ui/components/island-is'

import { ApplicationDto, Paging } from '../../gen/fetch'
import { ApplicationCard } from './ApplicationCard'

type Props = {
  applications: any[]
  paging: Paging
  onPageChange?: (page: number) => void
}

export const ApplicationList = ({
  applications,
  paging,
  onPageChange,
}: Props) => {
  return (
    <GridContainer>
      <GridRow marginBottom={8}>
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
                itemsPerPage={100}
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
