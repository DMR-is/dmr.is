import React from 'react'

import { Box, Inline } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'

import { Paging } from '../../gen/fetch'
import { TRPCErrorAlert } from '../trpc/TRPCErrorAlert'

type UserItem = {
  id: string
  name: string
  email?: string
  nationalId: string
  actions?: React.ReactElement[]
}

type Props = {
  users?: UserItem[]
  paging?: Paging
  error?: React.ComponentProps<typeof TRPCErrorAlert>['error']
  loading?: boolean
  actionButton?: React.ReactNode
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export const UsersTable = ({
  users,
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
      field: 'email',
      children: 'Netfang',
    },
    {
      field: 'nationalId',
      children: 'Kennitala',
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

  const rows = users?.map((user) => {
    return {
      name: user.name,
      email: user.email || '-',
      nationalId: user.nationalId,
      actions: actionButton ? (
        <Box width="full">
          <Inline alignY="center" space={[1, 2]} flexWrap="nowrap">
            {React.Children.map(user.actions, (action, index) => (
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
      noDataMessage="Engir notendur fundust"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
    />
  )
}
