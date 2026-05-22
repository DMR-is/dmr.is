'use client'

import { Select } from '@dmr.is/ui/components/island-is/Select'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  reportId: string
  assignedUserId?: string | null
  disabled?: boolean
}

export const EmployeeSelect = ({
  reportId,
  assignedUserId,
  disabled,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.user.list.queryOptions(),
  )

  const assign = useMutation({
    ...trpc.reportWorkflow.assign.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.reports.getById.queryKey({ id: reportId }),
      })
      toast.success(reportText.employeeSelect.successToast)
    },

    onError: () => {
      toast.error(reportText.employeeSelect.errorToast)
    },
  })

  const options = (users ?? []).map((u) => ({
    label: `${u.firstName} ${u.lastName}`,
    value: u.id,
  }))

  const value = options.find((o) => o.value === assignedUserId) ?? null

  return (
    <Select
      size="sm"
      label={reportText.employeeSelect.label}
      options={options}
      value={value}
      isClearable
      isLoading={isLoadingUsers || assign.isPending}
      isDisabled={disabled}
      onChange={(opt) => {
        if (!opt) assign.mutate({ reportId, userId: null })
        else assign.mutate({ reportId, userId: opt.value })
      }}
    />
  )
}
