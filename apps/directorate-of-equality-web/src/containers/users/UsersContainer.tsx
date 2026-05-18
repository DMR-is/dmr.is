'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
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
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'

import { useSuspenseQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const COLUMNS: ColumnDef<UserDto>[] = [
  {
    accessorKey: 'firstName',
    header: 'Nafn',
    enableSorting: true,
    cell: ({ row }) =>
      `${row.original.firstName} ${row.original.lastName}`.trim(),
  },
  {
    accessorKey: 'nationalId',
    header: 'Kennitala',
    enableSorting: false,
    cell: ({ getValue }) => formatNationalId(getValue<string>()),
  },
  { accessorKey: 'email', header: 'Netfang', enableSorting: true },
  { accessorKey: 'phone', header: 'Sími', enableSorting: false },
  {
    accessorKey: 'isActive',
    header: 'Staða',
    enableSorting: true,
    cell: ({ getValue }) => (
      <TableCell
        items={{
          type: 'tag',
          variant: getValue<boolean>() ? 'mint' : 'red',
          children: getValue<boolean>() ? 'Virkur' : 'Óvirkur',
        }}
      />
    ),
  },
]

export const UsersContainer = () => {
  const trpc = useTRPC()
  const [showInactive, setShowInactive] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: users } = useSuspenseQuery(
    trpc.user.listActive.queryOptions(undefined),
  )

  const filtered = (users ?? []).filter((u) => showInactive || u.isActive)

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
              Aðgerðir
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
              Nýr notandi
            </Button>
            <Button
              icon={showInactive ? 'eyeOff' : 'eye'}
              iconType="outline"
              variant="utility"
              colorScheme="white"
              fluid
              size="small"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? 'Fela óvirka' : 'Sýna óvirka'}
            </Button>
          </Stack>
        </GridColumn>

        <GridColumn span={['12/12', '9/12']}>
          <Stack space={2}>
            <Inline space={1} alignY="center">
              <Text fontWeight="semiBold">{filtered.length}</Text>
              <Text>notendur fundust</Text>
            </Inline>
            <Table
              columns={COLUMNS}
              data={filtered}
              noDataMessage="Engir notendur skráðir"
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
