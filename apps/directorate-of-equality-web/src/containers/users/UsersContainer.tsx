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
import { useIsMobile } from '../../hooks/useIsMobile'
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
    meta: { fit: true },
  },
  {
    accessorKey: 'nationalId',
    header: usersText.modal.nationalIdLabel,
    enableSorting: false,
    cell: ({ getValue }) => formatNationalId(getValue<string>()),
    meta: { fit: true },
  },
  {
    accessorKey: 'email',
    header: sharedText.form.emailLabel,
    enableSorting: true,
    // The widest column by far, and the only one whose content varies in
    // length, so it takes the slack the others leave rather than all six
    // columns sharing the width equally.
    meta: { grow: true },
  },
  {
    accessorKey: 'phone',
    header: sharedText.form.phoneShortLabel,
    enableSorting: false,
    meta: { fit: true },
  },
  {
    accessorKey: 'role',
    header: usersText.roleLabel,
    enableSorting: true,
    cell: ({ getValue }) => {
      const isAdmin = getValue<string>() === 'ADMIN'
      return (
        <TableCell
          items={{
            type: 'tag',
            variant: isAdmin ? 'blue' : 'purple',
            children: isAdmin ? usersText.roleAdmin : usersText.roleEditor,
          }}
        />
      )
    },
    meta: { fit: true },
  },
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
    meta: { fit: true },
  },
]

export const UsersContainer = () => {
  const { isMobile } = useIsMobile()
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
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          {!isMobile && (
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
          )}
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          <Box marginLeft={[0, 0, 0, 2]}>
            <Stack space={2}>
              <Inline space={1} alignY="center">
                <Text fontWeight="semiBold">{visibleUsers.length}</Text>
                <Text>{usersText.resultsText}</Text>
              </Inline>
              {/*
                `layout="auto"` with the `fit`/`grow` meta above, rather than the
                default `fixed`. Fixed layout gave all six columns an equal
                sixth of the width, so `Sími` — seven digits — got as much room
                as `Netfang`, whose addresses need roughly twice that. An email
                has no break opportunity, so it overflowed its cell and rendered
                on top of the phone number, and the surplus turned into a
                horizontal scrollbar on the `overflow: auto` wrapper island-ui
                puts around every table.
              */}
              <Table
                layout="auto"
                columns={COLUMNS}
                data={visibleUsers}
                noDataMessage={usersText.noData}
                onRowClick={openEdit}
              />
              {isMobile && (
                <Stack space={2}>
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
                    {showInactive
                      ? usersText.hideInactive
                      : usersText.showInactive}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
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
