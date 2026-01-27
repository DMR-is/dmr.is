import React from 'react'

import { Box, Inline, Tag } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Paging } from '../../gen/fetch'

type SubscriberItem = {
  id: string
  name?: string | null
  nationalId: string
  email?: string | null
  isActive: boolean
  subscribedFrom?: string | null
  subscribedTo?: string | null
  actions?: React.ReactElement[]
}

type Props = {
  subscribers?: SubscriberItem[]
  paging?: Paging
  loading?: boolean
  actionButton?: React.ReactNode
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('is-IS')
}

export const SubscribersTable = ({
  subscribers,
  paging,
  loading,
  actionButton,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const columns: DataTableColumnProps[] = [
    {
      field: 'name',
      children: 'Nafn',
    },
    {
      field: 'nationalId',
      children: 'Kennitala',
      size: 'tiny',
    },
    {
      field: 'email',
      children: 'Netfang',
    },
    {
      field: 'subscription',
      children: 'Áskrift',
    },
    {
      field: 'isActive',
      children: 'Staða',
      size: 'tiny',
    },
  ]

  if (actionButton) {
    columns.push({
      field: 'actions',
      children: actionButton,
      align: 'right',
      size: 'tiny',
    })
  }

  const rows = subscribers?.map((subscriber) => {
    const subscriptionText =
      subscriber.subscribedFrom && subscriber.subscribedTo
        ? `${formatDate(subscriber.subscribedFrom)} - ${formatDate(subscriber.subscribedTo)}`
        : subscriber.subscribedFrom
          ? `Frá ${formatDate(subscriber.subscribedFrom)}`
          : '-'

    return {
      name: subscriber.name || '-',
      nationalId: subscriber.nationalId,
      email: subscriber.email || '-',
      subscription: subscriptionText,
      isActive: (
        <Tag disabled variant={subscriber.isActive ? 'mint' : 'red'}>
          {subscriber.isActive ? 'Virkur' : 'Óvirkur'}
        </Tag>
      ),
      actions: actionButton ? (
        <Box width="full">
          <Inline alignY="center" space={[1, 2]} flexWrap="nowrap">
            {React.Children.map(subscriber.actions, (action, index) => (
              <React.Fragment key={index}>{action}</React.Fragment>
            ))}
          </Inline>
        </Box>
      ) : undefined,
    }
  })

  return (
    <DataTable
      columns={columns}
      rows={rows}
      paging={paging}
      noDataMessage="Engir áskrifendur fundust"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
    />
  )
}
