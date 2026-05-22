'use client'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'

import { UserModal } from '../../components/users/UserModal'
import { type UserDto } from '../../gen/fetch/types.gen'
import { sharedText, usersText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useSuspenseQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const COLUMNS: ColumnDef<UserDto>[] = [
  {
    accessorKey: 'firstName',
    header: sharedText.form.nameLabel,
    enableSorting: true,
    cell: ({ row }) =>
      `${row.original.firstName} ${row.original.lastName}`.trim(),
  },
  {
    accessorKey: 'nationalId',
    header: usersText.modal.nationalIdLabel,
    enableSorting: false,
    cell: ({ getValue }) => formatNationalId(getValue<string>()),
  },
  { accessorKey: 'email', header: sharedText.form.emailLabel, enableSorting: true },
  { accessorKey: 'phone', header: sharedText.form.phoneShortLabel, enableSorting: false },
  {
    accessorKey: 'isActive',
    header: sharedText.statusLabel,
    enableSorting: true,
    cell: ({ getValue }) => (
      <TableCell
        items={{
          type: 'tag',
          variant: getValue<boolean>() ? 'mint' : 'red',
          children: getValue<boolean>() ? usersText.active : usersText.inactive,
        }}
      />
    ),
  },
]

export const UsersContainer = () => {
  const trpc = useTRPC()
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const { data: users } = useSuspenseQuery(
    trpc.user.list.queryOptions({ showInactive }),
  )

  const visibleUsers = users ?? []

  const openCreate = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const openEdit = (user: UserDto) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <Stack space={2}>
            <Text variant="h5" fontWeight="semiBold">
              {usersText.actionsHeading}
            </Text>
            <Button
              icon="add"
              iconType="outline"
              fluid
              size="small"
              onClick={openCreate}
              variant="utility"
              colorScheme="white"
            >
              {usersText.createButton}
            </Button>
            <Button
              icon={showInactive ? 'eyeOff' : 'eye'}
              iconType="outline"
              fluid
              size="small"
              onClick={() => setShowInactive((v) => !v)}
              variant="utility"
              colorScheme="white"
            >
              {showInactive ? usersText.hideInactive : usersText.showInactive}
            </Button>
          </Stack>
        </GridColumn>

        <GridColumn span={['12/12', '9/12']}>
          <Stack space={2}>
            <Inline space={1} alignY="center">
              <Text fontWeight="semiBold">{visibleUsers.length}</Text>
              <Text>{usersText.resultsText}</Text>
            </Inline>
            <Table
              columns={COLUMNS}
              data={visibleUsers}
              noDataMessage={usersText.noData}
              onRowClick={openEdit}
            />
          </Stack>
        </GridColumn>
      </GridRow>

      <UserModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </GridContainer>
  )
}
