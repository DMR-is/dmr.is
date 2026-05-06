'use client'

import { useMemo } from 'react'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Select } from '@dmr.is/ui/components/island-is/Select'

import { zReportStatusEnum } from '../gen/fetch/zod.gen'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  id: string
}

const mockUsers = [
  { id: 'emp-1', name: 'Anna Jónsdóttir', isActive: true },
  { id: 'emp-2', name: 'Bjarni Sigurðsson', isActive: true },
  { id: 'emp-3', name: 'Elín Guðmundsdóttir', isActive: true },
  { id: 'emp-4', name: 'Katrín Ólafsdóttir', isActive: true },
]

export const EmployeeSelect = ({ id }: Props) => {
  const trpc = useTRPC()

  // const { data: usersData, isLoading } = useQuery(
  //   trpc.users.getAll.queryOptions(),
  // )

  const { data: report } = useQuery(
    trpc.reports.getById.queryOptions({ id: id }),
  )

  const assignedUserId = '123' //report?.reviewerUserId

  // const { assignUser, isAssigningUser, assignAndUpdateStatus } =
  //   useUpdateReport(reportId)

  const users = mockUsers //usersData?.users?.length ? usersData.users : mockUsers

  const options = users.map((user) => ({
    label: user.name,
    value: user.id,
    disabled: !user.isActive,
  }))

  const selected = options?.find((option) => option.value === assignedUserId)

  const filteredOptions = useMemo(() => {
    if (!options) return []
    return options?.filter((option) => {
      if (option.value === assignedUserId) {
        return true
      }

      return !option.disabled
    })
  }, [selected, options])

  return (
    <Select
      size="sm"
      label="Starfsmaður"
      options={filteredOptions}
      isLoading={false} //{isLoading || isAssigningUser}
      value={selected}
      onChange={(opt) => {
        // eslint-disable-next-line no-console
        console.log('Selected user ID:', opt?.value)
      }}
    />
  )
}
