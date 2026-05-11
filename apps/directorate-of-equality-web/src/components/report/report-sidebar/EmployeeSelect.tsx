'use client'

import { Select } from '@dmr.is/ui/components/island-is/Select'

import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  assignedUserId?: string | null
}

export const EmployeeSelect = ({ reportId, assignedUserId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.user.listActive.queryOptions(),
  )

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      }),
  })

  const options = (users ?? []).map((u) => ({
    label: `${u.firstName} ${u.lastName}`,
    value: u.id,
  }))

  const value = options.find((o) => o.value === assignedUserId) ?? null

  return (
    <Select
      size="sm"
      label="Starfsmaður"
      options={options}
      value={value}
      isClearable
      isLoading={isLoadingUsers || assign.isPending}
      onChange={(opt) => {
        if (!opt) assign.mutate({ reportId, userId: null })
        else
          assign.mutate({ reportId, userId: (opt as { value: string }).value })
      }}
    />
  )
}
